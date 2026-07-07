"""RAG pipeline: embeddings, vector store, retrieval, and response generation."""

import os
import time
from typing import Dict, List, Optional, Tuple

from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

from config import settings
from rag.document_loader import DocumentLoader
from services.openrouter_service import openrouter_service


class SentenceTransformerEmbeddings:
    """LangChain-compatible embeddings wrapper for Sentence Transformers."""

    def __init__(self, model_name: str):
        self._model: Optional[SentenceTransformer] = None
        self._model_name = model_name

    def _get_model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = SentenceTransformer(self._model_name)
        return self._model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        model = self._get_model()
        embeddings = model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        model = self._get_model()
        embedding = model.encode([text], show_progress_bar=False)
        return embedding[0].tolist()


class RAGPipeline:
    def __init__(self):
        self.embeddings = SentenceTransformerEmbeddings(settings.embedding_model)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        self.vector_store: Optional[Chroma] = None
        self.document_loader = DocumentLoader(settings.documents_dir)
        self._initialized = False

    def initialize(self) -> None:
        if self._initialized:
            return

        persist_dir = settings.vector_store_path
        if os.path.exists(persist_dir) and os.listdir(persist_dir):
            self.vector_store = Chroma(
                persist_directory=persist_dir,
                embedding_function=self.embeddings,
            )
        else:
            self._build_vector_store()

        self._initialized = True

    def _build_vector_store(self) -> None:
        documents = self.document_loader.load_all()
        if not documents:
            raise RuntimeError(
                f"No documents found in {settings.documents_dir}. "
                "Please add HR policy documents before starting the server."
            )

        chunks = self.text_splitter.split_documents(documents)
        self.vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=settings.vector_store_path,
        )
        self.vector_store.persist()

    def rebuild(self) -> int:
        self._initialized = False
        persist_dir = settings.vector_store_path
        if os.path.exists(persist_dir):
            import shutil
            shutil.rmtree(persist_dir)
        self.initialize()
        return self.vector_store._collection.count() if self.vector_store else 0

    def retrieve(self, query: str, top_k: Optional[int] = None) -> Tuple[str, List[Dict]]:
        self.initialize()
        k = top_k or settings.top_k_results
        results = self.vector_store.similarity_search_with_relevance_scores(query, k=k)

        sources: List[Dict] = []
        context_parts: List[str] = []

        for doc, score in results:
            if score < 0.1:
                continue
            source = {
                "document": doc.metadata.get("document", "Unknown"),
                "section": doc.metadata.get("section", "N/A"),
                "content": doc.page_content[:500],
                "relevance": round(float(score), 4),
            }
            sources.append(source)
            context_parts.append(
                f"[{source['document']} - {source['section']}]\n{doc.page_content}"
            )

        context = "\n\n---\n\n".join(context_parts) if context_parts else ""
        return context, sources

    def calculate_confidence(self, sources: List[Dict]) -> float:
        if not sources:
            return 0.0
        scores = [s["relevance"] for s in sources]
        avg = sum(scores) / len(scores)
        return round(min(avg * 1.2, 1.0), 4)

    async def answer(
        self, question: str
    ) -> Tuple[str, List[Dict], float, int]:
        start_time = time.time()

        context, sources = self.retrieve(question)
        confidence = self.calculate_confidence(sources)

        answer = await openrouter_service.generate_response(question, context, sources)

        response_time_ms = int((time.time() - start_time) * 1000)
        return answer, sources, confidence, response_time_ms

    async def stream_answer(
        self, question: str
    ) -> Tuple[List[Dict], float, int, object]:
        start_time = time.time()

        context, sources = self.retrieve(question)
        confidence = self.calculate_confidence(sources)

        stream = openrouter_service.stream_response(question, context, sources)
        return sources, confidence, int((time.time() - start_time) * 1000), stream


rag_pipeline = RAGPipeline()
