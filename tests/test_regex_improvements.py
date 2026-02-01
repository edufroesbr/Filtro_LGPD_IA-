
import re
import unittest

# Improved Address Regex with negative lookaheads and context requirements
# Version 6: Fixed lowercase street keyword false positive
ADDRESS_REGEX = r'''(?x)  # Verbose mode for readability
    \b(?:
        # Brasília specific patterns (SQS, QL, QI, etc.) - MUST be uppercase
        (?:S(?:Q[SNL]|C[SNL]|H[SNL]|I[AG]|M[PD]W)|Q[NSILRE]|CA|SMPW|SMDB|AE)\s+[A-Za-z0-9]+
        |
        (?:Park\s+Way|Arniqueiras)
        |
        # Bloco - only if followed by a letter/number (not "de")
        Bloco\s+(?![dD][eE]\s)[A-Z0-9]
        |
        # Conjunto - only if followed by number or capital letter (not "de")
        Conjunto\s+(?![dD][eE]\s)(?:[A-Z0-9]+|[0-9]+)
        |
        # Street names - MUST have capitalized street type keyword
        # Street type must be capitalized (Rua, not rua) to avoid matching casual mentions
        (?:Rua|Av\.|Avenida|Alameda|Travessa)\s+
        (?![sS][eE][mM]\s)  # Not "sem"
        (?:
            # Multi-word street name (case-insensitive for street name part)
            (?i:[A-Z][A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)+)(?-i:(?:,\s*\d+|,?\s+n[uú]mero\s+\d+)?)
            |
            # Single word + number (e.g., "Paulista 1000")
            (?i:[A-Z][A-Za-zÀ-ÿ]+)\s+\d+
            |
            # "das/da" + proper name
            (?i:das?\s+[A-Z][A-Za-zÀ-ÿ]+)
        )
        |
        # Setor/Área/Quadra/Lote - require alphanumeric identifier
        (?:Setor|Área|Quadra|Lote)\s+[A-Za-z0-9]+
        |
        # Cj. abbreviation
        Cj\.\s+[A-Z0-9]+
    )
'''

class TestAddressRegex(unittest.TestCase):
    def test_positive_addresses(self):
        """Should match these valid addresses"""
        addresses = [
            "Moro na SQS 102 Bloco A",
            "Endereço: QL 12 Conjunto 4 Casa 10",
            "Rua das Pitangueiras, numero 20",
            "Av. Paulista 1000",
            "Quadra 302 Conjunto 5",
            "Setor Comercial Sul Quadra 3",
            "SMPW Quadra 5 Conjunto 2",
            "Arniqueiras Conjunto 4",
            "Moro no Bloco C da SQS 202"
        ]
        for addr in addresses:
            with self.subTest(addr=addr):
                match = re.search(ADDRESS_REGEX, addr, re.IGNORECASE)
                self.assertTrue(match, f"Failed to match: {addr}")

    def test_negative_addresses(self):
        """Should NOT match these non-addresses"""
        non_addresses = [
            "Eu quero saber uma coisa",
            "O problema é a falta de luz",
            "Gosto muito do parque",
            "Aquele setor é complicado", # 'setor' by itself might be too generic if followed by generic words, but let's see
            "Bloco de anotações", # 'Bloco' is tricky
            "Conjunto de ideias", # 'Conjunto' is tricky
            "Rua sem saída" # 'Rua' usually implies address, maybe okay to match
        ]
        # We expect some false positives with the current regex, checking which ones.
        # This test helps us refine it.
        for text in non_addresses:
            print(f"Testing negative: '{text}' -> Match: {bool(re.search(ADDRESS_REGEX, text, re.IGNORECASE))}")

if __name__ == '__main__':
    unittest.main()
