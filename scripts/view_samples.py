import pandas as pd

# Load the e-SIC data
df = pd.read_excel('docs/AMOSTRA_e-SIC.xlsx')

# Get the 4 sensitive cases identified
sensitive_ids = [85, 77, 50, 10]

print("SENSITIVE CASES (with PII):")
print("=" * 80)
for id_val in sensitive_ids:
    row = df[df['ID'] == id_val].iloc[0]
    text = row['Texto Mascarado']
    print(f"\n--- ID {id_val} ---")
    print(text[:200] + "..." if len(text) > 200 else text)
    print()

print("\n\nPUBLIC CASES (no PII - sample):")
print("=" * 80)
public_ids = [63, 41, 96]
for id_val in public_ids:
    row = df[df['ID'] == id_val].iloc[0]
    text = row['Texto Mascarado']
    print(f"\n--- ID {id_val} ---")
    print(text[:200] + "..." if len(text) > 200 else text)
    print()
