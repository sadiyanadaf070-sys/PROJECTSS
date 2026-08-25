import torch
import torch.nn as nn
import torch.nn.functional as F

# =====================================================================
# PHASE 1: DATA & TOKENIZATION (Slicing text into numbers)
# =====================================================================
# Our tiny training corpus
training_data = "the cat sat on the mat. the dog sat on the log."

# Create vocabulary: find every unique character
vocab = sorted(list(set(training_data)))
vocab_size = len(vocab)

# Mapping dictionaries (The Tokenizer)
char_to_id = {ch: i for i, ch in enumerate(vocab)}
id_to_char = {i: ch for i, ch in enumerate(vocab)}

def encode(text_string):
    return [char_to_id[c] for c in text_string]

def decode(id_list):
    return "".join([id_to_char[i] for i in id_list])


# =====================================================================
# PHASE 2: THE PRACTICAL LLM ARCHITECTURE
# =====================================================================
class ExplanatoryMiniLLM(nn.Module):
    def __init__(self, vocab_size, embedding_dim):
        super().__init__()
        # STEP 2 & 3: Vector Embedding Layer
        # Maps token IDs to a continuous vector space
        self.token_embeddings = nn.Embedding(vocab_size, embedding_dim)
        
        # STEP 4: Attention Projection Layers (Query, Key, Value)
        self.query_layer = nn.Linear(embedding_dim, embedding_dim, bias=False)
        self.key_layer = nn.Linear(embedding_dim, embedding_dim, bias=False)
        self.value_layer = nn.Linear(embedding_dim, embedding_dim, bias=False)
        
        # STEP 5: Feed-Forward Network Layer (The output projector)
        self.output_projection = nn.Linear(embedding_dim, vocab_size)

    def forward(self, token_ids):
        # Shape of token_ids: (Batch Size=1, Sequence Length=T)
        B, T = token_ids.shape
        
        # 1. Fetch Embeddings
        # Convert IDs into rich decimal coordinate vectors
        x = self.token_embeddings(token_ids) # Shape: (B, T, embedding_dim)
        
        # 2. Self-Attention Mechanism (Calculating contextual relationships)
        # Project our vectors into Q, K, and V spaces
        Q = self.query_layer(x)  # What this token is looking for
        K = self.key_layer(x)    # What properties this token possesses
        V = self.value_layer(x)  # The actual contents of the token
        
        # Calculate attention scores (dot-product multiplication)
        # This determines how much every token cares about every other token
        attention_scores = torch.matmul(Q, K.transpose(-2, -1)) # Shape: (B, T, T)
        
        # Causal Masking: Prevent tokens from looking into the future!
        # An LLM can only look at past words to predict the next word.
        mask = torch.tril(torch.ones(T, T)).to(token_ids.device)
        attention_scores = attention_scores.masked_fill(mask == 0, float('-inf'))
        
        # Softmax: Turn raw score values into percentages (adding up to 100%)
        attention_weights = F.softmax(attention_scores, dim=-1)
        
        # Multiply weights by the Values to get context-aware embeddings
        context_vectors = torch.matmul(attention_weights, V) # Shape: (B, T, embedding_dim)
        
        # 3. Output Predictions (Logits)
        logits = self.output_projection(context_vectors) # Shape: (B, T, vocab_size)
        return logits

    def generate_next_char(self, input_text, max_new_tokens=30):
        self.eval() # Put model in evaluation mode
        generated_ids = encode(input_text)
        
        for _ in range(max_new_tokens):
            # Convert current string history to tensor format
            input_tensor = torch.tensor([generated_ids], dtype=torch.long)
            
            with torch.no_grad():
                logits = self(input_tensor)
            
            # Step 6: Focus strictly on the very last prediction slice
            next_token_logits = logits[0, -1, :]
            
            # Step 7: Apply Softmax and sample the next token character
            probs = F.softmax(next_token_logits, dim=-1)
            next_token_id = torch.multinomial(probs, num_samples=1).item()
            
            # Append new token to the sequence history
            generated_ids.append(next_token_id)
            
        return decode(generated_ids)

# =====================================================================
# PHASE 3: EXECUTION & LEARNING CHECKS
# =====================================================================
# Initialize model with 16-dimensional embedding spaces
model = ExplanatoryMiniLLM(vocab_size=vocab_size, embedding_dim=16)

print("--- TESTING THE LLM BEFORE TRAINING ---")
prompt = "the cat "
untrained_output = model.generate_next_char(prompt, max_new_tokens=20)
print(f"Prompt: '{prompt}' -> Generated: '{untrained_output}'\n")

# Simple training loop to show it updating weights
optimizer = torch.optim.AdamW(model.parameters(), lr=0.01)
training_tokens = torch.tensor([encode(training_data)], dtype=torch.long)

# Format inputs (0 to second to last token) and targets (1 to last token)
inputs = training_tokens[:, :-1]
targets = training_tokens[:, 1:]

print("Training model to memorize patterns...")
for epoch in range(150):
    logits = model(inputs)
    
    # Reshape vectors to evaluate loss
    B, T, C = logits.shape
    loss = F.cross_entropy(logits.view(B*T, C), targets.view(B*T))
    
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

print(f"Training Complete! Final Loss Value: {loss.item():.4f}\n")

print("--- TESTING THE LLM AFTER TRAINING ---")
trained_output = model.generate_next_char(prompt, max_new_tokens=20)
print(f"Prompt: '{prompt}' -> Generated: '{trained_output}'")


# Practical Inspection: Let's see a token ID turn into an embedding vector
sample_token = torch.tensor([[char_to_id['c']]])
embedding_vector = model.token_embeddings(sample_token)

print("\n--- Practical Inspection ---")
print(f"Character 'c' is Token ID: {char_to_id['c']}")
print(f"Its 16-dimensional continuous embedding coordinates look like:\n{embedding_vector.strip().detach().numpy()[0][0]}")
