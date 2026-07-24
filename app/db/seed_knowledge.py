"""
SQLite RAMP Knowledge Base Seed Hydration Script
Populates app/data/marketing_os.db with structured facts from 13 Neo-Cloud Scrapes
"""

import sys
import sqlite3
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.db.database import init_db, get_connection
from app.core.primitives import new_id

KNOWLEDGE_SEED_DATA = [
    # --- E2E NETWORKS (OUR ORGANIZATION) ---
    {
        "organization": "E2E Networks",
        "knowledge_class": "pricing",
        "confidence": "high",
        "content": "NVIDIA B200 GPU instances available from ₹671.00 /hr ($6.99 /hr) with transparent per-minute billing and no hidden fees.",
        "source_url": "https://www.e2enetworks.com/pricing",
        "enriched_by": "deep_crawler"
    },
    {
        "organization": "E2E Networks",
        "knowledge_class": "pricing",
        "confidence": "high",
        "content": "NVIDIA H100 GPU instances starting at ₹334.00 /hr. NVIDIA A100 starting at ₹362.00 /hr. NVIDIA L40S starting at ₹27.40 /hr. CPU instances from ₹0.14 /hr.",
        "source_url": "https://www.e2enetworks.com/pricing",
        "enriched_by": "deep_crawler"
    },
    {
        "organization": "E2E Networks",
        "knowledge_class": "hardware",
        "confidence": "high",
        "content": "Hardware fleet: NVIDIA B200, H200, H100, A100, L40S, HGX clusters. Sub-90s cluster scaling, zero queues, 1GBps per GPU fast storage fabric.",
        "source_url": "https://www.e2enetworks.com/",
        "enriched_by": "deep_crawler"
    },
    {
        "organization": "E2E Networks",
        "knowledge_class": "software",
        "confidence": "high",
        "content": "TIR AI Platform features: RAG pipelines, No-code AI agents, Indic Voice AI, LLM fine-tuning engine, native Hugging Face & Weights & Biases integrations, and foundation model APIs.",
        "source_url": "https://www.e2enetworks.com/tir",
        "enriched_by": "deep_crawler"
    },
    {
        "organization": "E2E Networks",
        "knowledge_class": "compliance",
        "confidence": "high",
        "content": "MeitY Empaneled, SOC2 Compliant, ISO 27001 Certified, 99.95% SLA Uptime guaranteed. NSE Listed India AI-first hyperscaler powering 15,000+ businesses.",
        "source_url": "https://www.e2enetworks.com/company",
        "enriched_by": "deep_crawler"
    },
    
    # --- YOTTA DATA SERVICES (INDIA) ---
    {
        "organization": "Yotta Data Services",
        "knowledge_class": "product",
        "confidence": "high",
        "content": "Shakti Cloud offers AI Lab (managed Jupyter Notebooks with H100/L40S GPUs), AI Workspace VM, Bare Metal GPU servers, and Serverless GPUs powered by NVIDIA NIMs endpoints.",
        "source_url": "https://yotta.com/shakti-cloud/",
        "enriched_by": "deep_crawler"
    },
    {
        "organization": "Yotta Data Services",
        "knowledge_class": "positioning",
        "confidence": "high",
        "content": "Positioning: 'India’s Trusted Partner for Sovereign Digital Infrastructure'. Focuses heavily on large enterprise data center colocation and sovereign cloud.",
        "source_url": "https://yotta.com/",
        "enriched_by": "deep_crawler"
    },

    # --- NEYSA AI (INDIA) ---
    {
        "organization": "Neysa AI",
        "knowledge_class": "product",
        "confidence": "high",
        "content": "Neysa Velocis: AI Acceleration Cloud System simplifying AI deployment, management, and enterprise security governance for Indian startups and enterprises.",
        "source_url": "https://neysa.ai/",
        "enriched_by": "deep_crawler"
    },

    # --- TOGETHER AI (GLOBAL) ---
    {
        "organization": "Together AI",
        "knowledge_class": "partnership",
        "confidence": "high",
        "content": "Announced Series C funding and dedicated Y Combinator GPU cluster partnership to deliver B200 GPU nodes for AI startups.",
        "source_url": "https://www.together.ai/",
        "enriched_by": "deep_crawler"
    },
    {
        "organization": "Together AI",
        "knowledge_class": "software",
        "confidence": "high",
        "content": "High-performance inference APIs for DeepSeek V4, Llama 3, MiniMax M3, Kimi K2.7, and dedicated container inference.",
        "source_url": "https://www.together.ai/models",
        "enriched_by": "deep_crawler"
    },

    # --- RUNPOD (GLOBAL) ---
    {
        "organization": "RunPod",
        "knowledge_class": "scale",
        "confidence": "high",
        "content": "Serves 1M+ AI developers across 31 global regions. Focuses on serverless GPU execution endpoints and instant AI agent execution.",
        "source_url": "https://www.runpod.io/",
        "enriched_by": "deep_crawler"
    },
    {
        "organization": "RunPod",
        "knowledge_class": "pricing",
        "confidence": "high",
        "content": "Spot GPU rates starting at ~$0.44/hr for RTX 4090 and ~$3.69/hr for H100 instances with serverless per-second billing.",
        "source_url": "https://www.runpod.io/pricing",
        "enriched_by": "deep_crawler"
    },

    # --- LAMBDA LABS (GLOBAL) ---
    {
        "organization": "Lambda Labs",
        "knowledge_class": "product",
        "confidence": "high",
        "content": "1-Click Clusters™ and Superclusters pre-installed with Lambda Stack (PyTorch, CUDA, drivers) for large-scale model training.",
        "source_url": "https://lambdalabs.com/",
        "enriched_by": "deep_crawler"
    },

    # --- NEBIUS (GLOBAL) ---
    {
        "organization": "Nebius",
        "knowledge_class": "hardware",
        "confidence": "high",
        "content": "Non-virtualized bare-metal NVIDIA B200/H200/H100 GPUs connected via 3.2Tbps InfiniBand fabric with built-in MLOps tooling.",
        "source_url": "https://nebius.com/",
        "enriched_by": "deep_crawler"
    }
]

def seed_database():
    init_db()
    conn = get_connection()
    try:
        # Recreate table if schema changed
        try:
            conn.execute("SELECT organization FROM knowledge_units LIMIT 1")
        except sqlite3.OperationalError:
            conn.execute("DROP TABLE IF EXISTS knowledge_units")
            
        conn.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_units (
            id TEXT PRIMARY KEY,
            organization TEXT NOT NULL DEFAULT 'E2E Networks',
            knowledge_class TEXT NOT NULL,
            confidence TEXT NOT NULL,
            content TEXT NOT NULL,
            source_url TEXT,
            enriched_by TEXT NOT NULL DEFAULT 'system',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)
        
        inserted_count = 0
        for item in KNOWLEDGE_SEED_DATA:
            conn.execute(
                """
                INSERT OR REPLACE INTO knowledge_units
                (id, organization, knowledge_class, confidence, content, source_url, enriched_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_id(),
                    item["organization"],
                    item["knowledge_class"],
                    item["confidence"],
                    item["content"],
                    item["source_url"],
                    item["enriched_by"]
                )
            )
            inserted_count += 1
            
        conn.commit()
        print(f"[+] Successfully seeded {inserted_count} structured knowledge units into SQLite database at {conn}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database()
