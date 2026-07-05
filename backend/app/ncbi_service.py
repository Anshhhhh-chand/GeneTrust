import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/ncbi", tags=["ncbi"])

NCBI_ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
NCBI_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

CURATED_MUTATIONS = {
    "CFTR": "ATCATCTTTGGTGTTTCCTA",
    "HBB": "ATGGTGCACCTGACTCCTGT",
    "HEXA": "CGTATATCCTATGCCCCTGA",
    "HTT": "CAGCAGCAGCAGCAGCAGCA",
}

@router.get("/gene/{gene_name}")
async def fetch_ncbi_gene(gene_name: str):
    """
    Query NCBI for a human gene and return a 20-mer sequence suitable for CRISPR analysis.
    """
    async with httpx.AsyncClient() as client:

        search_params = {
            "db": "nucleotide",
            "term": f"{gene_name}[Gene] AND \"Homo sapiens\"[Organism] AND refseq[Filter]",
            "retmode": "json",
            "retmax": "1"
        }

        try:
            search_response = await client.get(NCBI_ESEARCH_URL, params=search_params, timeout=10.0)
            search_response.raise_for_status()
            search_data = search_response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to query NCBI E-utilities: {str(e)}")

        id_list = search_data.get("esearchresult", {}).get("idlist", [])
        if not id_list:
            raise HTTPException(status_code=404, detail=f"No NCBI records found for human gene '{gene_name}'")

        gene_id = id_list[0]

        fetch_params = {
            "db": "nucleotide",
            "id": gene_id,
            "rettype": "fasta",
            "retmode": "text"
        }

        try:
            fetch_response = await client.get(NCBI_EFETCH_URL, params=fetch_params, timeout=10.0)
            fetch_response.raise_for_status()
            fasta_text = fetch_response.text
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch FASTA from NCBI: {str(e)}")

        lines = fasta_text.splitlines()
        sequence_lines = [line.strip().upper() for line in lines if not line.startswith(">")]
        full_sequence = "".join(sequence_lines)

        clean_sequence = "".join(c for c in full_sequence if c in "ATCG")

        if len(clean_sequence) < 20:
            raise HTTPException(status_code=400, detail="Gene sequence retrieved from NCBI is too short.")

        gn_upper = gene_name.upper()
        if gn_upper in CURATED_MUTATIONS:
            target_20mer = CURATED_MUTATIONS[gn_upper]
        else:
            target_20mer = clean_sequence[50:70] if len(clean_sequence) > 70 else clean_sequence[:20]

        header = lines[0][1:] if lines else f"NCBI ID {gene_id}"

        return {
            "gene": gene_name.upper(),
            "ncbi_id": gene_id,
            "description": header,
            "sequence": target_20mer,
            "full_length": len(clean_sequence)
        }
