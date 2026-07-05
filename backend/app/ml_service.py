import os
import torch
import numpy as np
from transformers import AutoModel, AutoTokenizer
from Bio import Align
from Bio.SeqUtils import molecular_weight, MeltingTemp as mt
from Bio.Seq import Seq

os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["USE_TORCH"] = "1"
os.environ["USE_CUDA"] = "0"
os.environ["USE_TRITON"] = "0"

MODEL_NAME = "zhihan1996/DNABERT-2-117M"
BASES = ['A', 'T', 'C', 'G']
device = "cpu"
torch.set_num_threads(4)

tokenizer = None
model = None
REFERENCE_EMBEDDINGS = None

def load_ml_model():
    global tokenizer, model, REFERENCE_EMBEDDINGS
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    print("Loading model...")
    try:
        model = AutoModel.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
            torch_dtype=torch.float32,
            device_map="cpu"
        )
    except Exception as e:
        print(f"Error loading DNABERT-2 model: {e}")
        try:
            model = AutoModel.from_pretrained(
                MODEL_NAME,
                trust_remote_code=True,
                low_cpu_mem_usage=True,
                torch_dtype=torch.float32
            )
        except Exception as e2:
            print(f"Alternative loading method failed: {e2}")
            try:
                print("Using fallback loading method...")
                from transformers import AutoConfig, BertModel
                config = AutoConfig.from_pretrained(MODEL_NAME, trust_remote_code=True)
                model = BertModel.from_pretrained(MODEL_NAME, config=config)
            except Exception as e3:
                print(f"All loading attempts failed: {e3}")
                print("Falling back to basic BERT model...")
                from transformers import BertModel as FallbackBertModel
                model = FallbackBertModel.from_pretrained("bert-base-uncased")

    model.eval()
    for param in model.parameters():
        param.requires_grad = False

    print("Model loaded successfully!")

    REFERENCE_SEQUENCES = [
        "CTACTTCAAATGGGGCTACA",
        "AGTCGTACTGCATGCTCGTA",
        "ATCGCTGACAATGCTGGACA"
    ]
    REFERENCE_EMBEDDINGS = generate_reference_token_embedding(REFERENCE_SEQUENCES)
    print("Reference embeddings ready!")

def get_token_embeddings(sequence):
    inputs = tokenizer(sequence, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)

    if isinstance(outputs, tuple):
        hidden_states = outputs[0]
    elif hasattr(outputs, 'last_hidden_state'):
        hidden_states = outputs.last_hidden_state
    else:
        hidden_states = outputs

    return hidden_states.squeeze(0)

def generate_reference_token_embedding(sequences):
    all_token_embeds = []
    max_len = 0
    for seq in sequences:
        token_embed = get_token_embeddings(seq)
        all_token_embeds.append(token_embed)
        max_len = max(max_len, token_embed.size(0))

    padded_embeds = []
    for emb in all_token_embeds:
        pad_size = max_len - emb.size(0)
        if pad_size > 0:
            emb = torch.cat([emb, torch.zeros(pad_size, emb.size(1), device=device)], dim=0)
        padded_embeds.append(emb)

    return torch.stack(padded_embeds).mean(dim=0)

def find_problematic_position(token_embeddings, reference_embeddings):
    cos = torch.nn.CosineSimilarity(dim=1)
    similarities = cos(token_embeddings, reference_embeddings[:token_embeddings.size(0)])
    return torch.argmin(similarities).item()

def choose_best_alternate_base(seq, idx, reference_token_embeddings):
    best_base = None
    best_score = -1
    original_base = seq[idx]

    for base in [b for b in BASES if b != original_base]:
        new_seq = seq[:idx] + base + seq[idx + 1:]
        token_embeds = get_token_embeddings(new_seq)
        sequence_embed = token_embeds.mean(dim=0).unsqueeze(0)
        reference_mean = reference_token_embeddings.mean(dim=0).unsqueeze(0)
        score = torch.cosine_similarity(sequence_embed, reference_mean).item()
        if score > best_score:
            best_score = score
            best_base = base

    return best_base, best_score

def get_sequence_score(seq, reference_token_embeddings):
    token_embeds = get_token_embeddings(seq)
    sequence_embed = token_embeds.mean(dim=0).unsqueeze(0)
    reference_mean = reference_token_embeddings.mean(dim=0).unsqueeze(0)
    return torch.cosine_similarity(sequence_embed, reference_mean).item()

def predict_edit(seq, reference_token_embeddings):
    token_embeds = get_token_embeddings(seq)
    problem_idx = find_problematic_position(token_embeds, reference_token_embeddings)
    new_base, edited_score = choose_best_alternate_base(seq, problem_idx, reference_token_embeddings)
    edited_seq = seq[:problem_idx] + new_base + seq[problem_idx + 1:]
    return edited_seq, problem_idx, new_base, edited_score

def calculate_gc_content(sequence: str) -> float:
    g_count = sequence.count('G')
    c_count = sequence.count('C')
    return round((g_count + c_count) / len(sequence) * 100, 2)

def calculate_biochemical_properties(sequence: str):

    mw = molecular_weight(Seq(sequence), seq_type="DNA")

    tm = mt.Tm_NN(Seq(sequence), nn_table=mt.DNA_NN1)

    return round(tm, 1), round(mw, 1)

def analyze_sequence(sequence: str):
    original_score = get_sequence_score(sequence, REFERENCE_EMBEDDINGS)
    edited_seq, index, base, edited_score = predict_edit(sequence, REFERENCE_EMBEDDINGS)

    efficiency = round(edited_score * 100, 2)
    original_efficiency = round(original_score * 100, 2)
    gain = round(efficiency - original_efficiency, 2)
    gc_content = calculate_gc_content(sequence)
    tm, mw = calculate_biochemical_properties(sequence)

    change_indicator = '.' * 20
    if index < len(change_indicator):
        change_indicator = change_indicator[:index] + '*' + change_indicator[index+1:]

    if edited_score > original_score:
        message = f"🔼 Editing improves similarity from {original_efficiency}% to {efficiency}% (+{gain}%)"
        explanation = (
            f"The original nucleotide '{sequence[index]}' at position {index + 1} "
            f"contributes negatively to the predicted efficiency. "
            f"Replacing it with '{base}' increases structural similarity to high-performing reference sequences, "
            f"boosting overall confidence by {gain}%."
        )
    else:
        message = f"✅ Sequence is already optimal (similarity: {original_efficiency}%)"
        explanation = "The current sequence is highly optimized and matches the embeddings of our highest performing reference targets. No mutations are recommended."

    return {
        "originalSequence": sequence,
        "editedSequence": edited_seq,
        "changeIndicator": change_indicator,
        "efficiency": efficiency,
        "changedPosition": index,
        "originalBase": sequence[index],
        "newBase": base,
        "message": message,
        "originalEfficiency": original_efficiency,
        "gcContent": gc_content,
        "explanation": explanation,
        "meltingTemp": tm,
        "molecularWeight": mw
    }

def align_sequences(seq1: str, seq2: str):
    aligner = Align.PairwiseAligner()
    aligner.mode = 'global'
    aligner.match_score = 1
    aligner.mismatch_score = -1
    aligner.open_gap_score = -2
    aligner.extend_gap_score = -0.5

    alignments = aligner.align(seq1, seq2)
    best_alignment = alignments[0]

    aligned_seq1 = str(best_alignment).split('\n')[0]
    aligned_seq2 = str(best_alignment).split('\n')[2] if len(str(best_alignment).split('\n')) >= 3 else seq2

    try:
        gapped = best_alignment.format('fasta').split('\n')

        fasta_seqs = [line for line in gapped if not line.startswith('>')]
        aligned_seq1 = fasta_seqs[0].strip() if len(fasta_seqs) > 0 else aligned_seq1
        aligned_seq2 = fasta_seqs[1].strip() if len(fasta_seqs) > 1 else aligned_seq2
    except Exception:
        pass

    alignment_match = ''
    matches = 0
    mismatches = 0
    gaps = 0
    for a, b in zip(aligned_seq1, aligned_seq2):
        if a == '-' or b == '-':
            alignment_match += ' '
            gaps += 1
        elif a == b:
            alignment_match += '|'
            matches += 1
        else:
            alignment_match += '.'
            mismatches += 1

    align_len = len(aligned_seq1)
    similarity = round((matches / align_len) * 100, 2) if align_len > 0 else 0

    seq1_tm, seq1_mw = calculate_biochemical_properties(seq1)
    seq2_tm, seq2_mw = calculate_biochemical_properties(seq2)
    seq1_gc = calculate_gc_content(seq1)
    seq2_gc = calculate_gc_content(seq2)

    return {
        "alignment_seq1": aligned_seq1,
        "alignment_match": alignment_match,
        "alignment_seq2": aligned_seq2,
        "matches": matches,
        "mismatches": mismatches,
        "gaps": gaps,
        "similarity_percent": similarity,
        "seq1_tm": seq1_tm,
        "seq2_tm": seq2_tm,
        "seq1_mw": seq1_mw,
        "seq2_mw": seq2_mw,
        "seq1_gc": seq1_gc,
        "seq2_gc": seq2_gc
    }

def compute_offtarget_risk(sequence: str) -> list:
    """
    Heuristic off-target risk scoring for a 20-mer CRISPR guide RNA.

    Biology rationale:
    - Seed region: PAM-proximal last 12 nt (positions 9-20 for a 20-mer, 0-indexed 8-19).
      Mismatches here are highly disruptive to Cas9 binding.
    - Distal region: first 8 nt (5' end) - mismatches tolerated more.
    - GC content of variant contributes to binding thermodynamics.
    - 1-mismatch variants are inherently higher risk than 2-mismatch variants.
    """
    seq_len = len(sequence)
    SEED_START = seq_len - 12

    sites = []

    for i in range(seq_len):
        for alt_base in [b for b in BASES if b != sequence[i]]:
            variant = sequence[:i] + alt_base + sequence[i+1:]
            in_seed = i >= SEED_START
            mismatch_penalty = 0.35 if in_seed else 0.12
            gc = (variant.count('G') + variant.count('C')) / seq_len
            gc_factor = 0.15 * gc
            score = round(max(0.0, min(1.0, 0.80 - mismatch_penalty + gc_factor)), 3)
            risk = "HIGH" if score >= 0.65 else "MEDIUM" if score >= 0.40 else "LOW"
            sites.append({
                "variant": variant,
                "position": i + 1,
                "original_base": sequence[i],
                "new_base": alt_base,
                "mismatches": 1,
                "risk": risk,
                "score": score,
                "region": "Seed (PAM-proximal)" if in_seed else "Distal (PAM-distal)",
            })

    two_mm_sites = []
    for i in range(seq_len):
        for j in range(i + 1, seq_len):
            for alt1 in [b for b in BASES if b != sequence[i]]:
                for alt2 in [b for b in BASES if b != sequence[j]]:
                    variant = sequence[:i] + alt1 + sequence[i+1:j] + alt2 + sequence[j+1:]
                    in_seed_i = i >= SEED_START
                    in_seed_j = j >= SEED_START
                    penalty_i = 0.35 if in_seed_i else 0.12
                    penalty_j = 0.35 if in_seed_j else 0.12
                    gc = (variant.count('G') + variant.count('C')) / seq_len
                    gc_factor = 0.10 * gc
                    score = round(max(0.0, min(1.0, 0.80 - penalty_i - penalty_j + gc_factor)), 3)
                    risk = "HIGH" if score >= 0.65 else "MEDIUM" if score >= 0.40 else "LOW"
                    two_mm_sites.append({
                        "variant": variant,
                        "position": i + 1,
                        "original_base": sequence[i],
                        "new_base": alt1,
                        "mismatches": 2,
                        "risk": risk,
                        "score": score,
                        "region": "Seed" if (in_seed_i or in_seed_j) else "Distal",
                    })

    two_mm_sites.sort(key=lambda x: x["score"], reverse=True)
    sites.extend(two_mm_sites[:30])
    sites.sort(key=lambda x: x["score"], reverse=True)
    return sites
