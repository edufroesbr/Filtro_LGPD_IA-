import random
import json
import os
from datetime import datetime, timedelta

# Synthetic Data Generators for Edital 8.1.1 Compliance
def generate_cpf():
    return f"{random.randint(100,999)}.{random.randint(100,999)}.{random.randint(100,999)}-{random.randint(10,99)}"

def generate_email(name):
    clean_name = name.lower().replace(' ', '.')
    domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'uol.com.br']
    return f"{clean_name}@{random.choice(domains)}"

def generate_phone():
    return f"(61) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}"

names = ["João Silva", "Maria Oliveira", "Pedro Santos", "Ana Costa", "Carlos Souza", "Fernanda Lima", "Mariana Alves", "Lucas Pereira"]
problems = [
    "Solicito o prontuário médico da minha mãe, Sra. {name}, CPF {cpf}, que faleceu no HRAN.",
    "Denúncia de assédio moral sofrido por {name} no setor de RH.",
    "Meu benefício foi cortado indevidamente. Meu contato é {phone}.",
    "Gostaria de saber o motivo do indeferimento da matrícula escolar do meu filho {name}.",
    "Reclamação sobre o médico Dr. X que atendeu {name} de forma grosseira.",
    "Solicito cópia do processo administrativo em nome de {name}, CPF {cpf}."
]

public_requests = [
    "Solicito a poda de árvore na quadra 302.",
    "Onde encontro o calendário de vacinação?",
    "Sugiro a instalação de lixeiras na W3.",
    "Qual o horário de funcionamento do Na Hora?",
    "Elogio aos servidores do posto de saúde da Asa Sul.",
    "Buraco na via principal precisa de reparo ugente."
]

data = []

# Generate 50 Sensitive items
for _ in range(50):
    name = random.choice(names)
    template = random.choice(problems)
    text = template.format(name=name, cpf=generate_cpf(), phone=generate_phone())
    data.append({
        "id": random.randint(10000, 99999),
        "text": text,
        "expected_privacy": "Sigiloso",
        "has_pii": True
    })

# Generate 50 Public items
for _ in range(50):
    text = random.choice(public_requests)
    data.append({
        "id": random.randint(10000, 99999),
        "text": text,
        "expected_privacy": "Público",
        "has_pii": False
    })

random.shuffle(data)

output_file = os.path.join(os.path.dirname(__file__), 'synthetic_pii_data.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Generated {len(data)} synthetic records for training/testing at {output_file}")
