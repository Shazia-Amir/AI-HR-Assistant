"""Document loader for HR policy files (Markdown, JSON, TXT)."""

import json
import os
from typing import Dict, List

from langchain_core.documents import Document


class DocumentLoader:
    def __init__(self, documents_dir: str):
        self.documents_dir = documents_dir

    def load_all(self) -> List[Document]:
        documents: List[Document] = []
        if not os.path.exists(self.documents_dir):
            return documents

        for root, _dirs, files in os.walk(self.documents_dir):
            for filename in sorted(files):
                filepath = os.path.join(root, filename)
                if filename.endswith(".md"):
                    documents.extend(self._load_markdown(filepath, filename))
                elif filename.endswith(".json"):
                    documents.extend(self._load_json(filepath, filename))
                elif filename.endswith(".txt"):
                    documents.extend(self._load_text(filepath, filename))

        return documents

    def _load_markdown(self, filepath: str, filename: str) -> List[Document]:
        docs: List[Document] = []
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        sections = self._split_markdown_sections(content)
        for section_title, section_content in sections:
            doc = Document(
                page_content=section_content,
                metadata={
                    "source": filename,
                    "document": filename.replace(".md", "").replace("_", " ").title(),
                    "section": section_title,
                    "file_type": "markdown",
                },
            )
            docs.append(doc)

        if not docs:
            doc = Document(
                page_content=content,
                metadata={
                    "source": filename,
                    "document": filename.replace(".md", "").replace("_", " ").title(),
                    "section": "Full Document",
                    "file_type": "markdown",
                },
            )
            docs.append(doc)

        return docs

    def _split_markdown_sections(self, content: str) -> List[tuple]:
        sections: List[tuple] = []
        current_title = "Introduction"
        current_lines: List[str] = []

        for line in content.split("\n"):
            if line.startswith("#"):
                if current_lines:
                    sections.append((current_title, "\n".join(current_lines).strip()))
                current_title = line.lstrip("#").strip()
                current_lines = [line]
            else:
                current_lines.append(line)

        if current_lines:
            sections.append((current_title, "\n".join(current_lines).strip()))

        return sections

    def _load_json(self, filepath: str, filename: str) -> List[Document]:
        docs: List[Document] = []
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        doc_name = filename.replace(".json", "").replace("_", " ").title()

        def flatten(obj: object, prefix: str = "") -> List[Dict]:
            items: List[Dict] = []
            if isinstance(obj, dict):
                for key, value in obj.items():
                    full_key = f"{prefix} > {key}" if prefix else key
                    if isinstance(value, (dict, list)):
                        items.extend(flatten(value, full_key))
                    else:
                        items.append({"section": full_key, "content": f"{key}: {value}"})
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    items.extend(flatten(item, f"{prefix}[{i}]"))
            return items

        flat_items = flatten(data)
        for item in flat_items:
            doc = Document(
                page_content=item["content"],
                metadata={
                    "source": filename,
                    "document": doc_name,
                    "section": item["section"],
                    "file_type": "json",
                },
            )
            docs.append(doc)

        return docs

    def _load_text(self, filepath: str, filename: str) -> List[Document]:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        return [
            Document(
                page_content=content,
                metadata={
                    "source": filename,
                    "document": filename.replace(".txt", "").replace("_", " ").title(),
                    "section": "Full Document",
                    "file_type": "text",
                },
            )
        ]

    def get_document_list(self) -> List[Dict]:
        documents: List[Dict] = []
        if not os.path.exists(self.documents_dir):
            return documents

        for root, _dirs, files in os.walk(self.documents_dir):
            for filename in sorted(files):
                if filename.endswith((".md", ".json", ".txt")):
                    filepath = os.path.join(root, filename)
                    stat = os.stat(filepath)
                    docs = self._load_markdown(filepath, filename) if filename.endswith(".md") else \
                           self._load_json(filepath, filename) if filename.endswith(".json") else \
                           self._load_text(filepath, filename)
                    documents.append({
                        "id": filename.replace(".", "_"),
                        "name": filename.replace("_", " ").rsplit(".", 1)[0].title(),
                        "type": filename.rsplit(".", 1)[-1],
                        "sections": len(docs),
                        "uploaded_at": None,
                    })

        return documents
