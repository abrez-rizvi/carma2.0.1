import os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

PDF_DIR = "papers"

docs = []

for file in os.listdir(PDF_DIR):
    if file.endswith(".pdf"):
        loader = PyPDFLoader(os.path.join(PDF_DIR, file))
        docs.extend(loader.load())

# Split into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150
)

chunks = splitter.split_documents(docs)

# Embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# FAISS index
db = FAISS.from_documents(chunks, embeddings)

db.save_local("faiss_index")

print("✅ FAISS index created successfully.")
