// Improved Regex - Strict Case Sensitive Version
const addressRegex = new RegExp(
    // 1. Codes (SQS, QNN) - Require Number or Structural Keyword immediately after
    // Supporting Upper (SQS) and Lower (sqs) variations manually
    "\\b(?:(?:S[A-Z]{2,4}|Q[A-Z]{1,3}|QI|QL|CA|SMPW|SMDB|Park Way|Arniqueiras|AE)|(?:s[a-z]{2,4}|q[a-z]{1,3}|qi|ql|ca|smpw|smdb|park way|arniqueiras|ae))\\s+(?:\\d|Quadra|quadra|QUADRA|Q\\.|q\\.|Conjunto|conjunto|CONJUNTO|Cj\\.|cj\\.|Lote|lote|LOTE|Bloco|bloco|BLOCO)" +
    "|" +
    // 2. Structural Keywords (Quadra, Lote) - Require Upper or Digit ID
    "\\b(?:Quadra|quadra|QUADRA|Q\\.|q\\.|Lote|lote|LOTE|Conjunto|conjunto|CONJUNTO|Cj\\.|cj\\.|Bloco|bloco|BLOCO)\\s+[A-Z0-9]" +
    "|" +
    // 3. Setor - Allow 'de' but require Upper/Digit ID
    "\\b(?:Setor|setor|SETOR|Área|área|AREA)\\s+(?:(?:de|do|da)\\s+)?[A-Z0-9]" +
    "|" +
    // 4. Streets - Require Digit
    "\\b(?:Rua|rua|RUA|Av\\.|av\\.|Avenida|avenida|AVENIDA|Alameda|alameda|ALAMEDA|Travessa|travessa|TRAVESSA)\\s+[A-Za-z0-9\\s,.-]*\\d"
    // No 'i' flag
);

const testCases = [
    { text: "Moro na QNN 2 Conjunto A Casa 10", expected: true },
    { text: "Endereço: SQS 302 Bloco A ent. 20", expected: true },
    { text: "SHIS QI 05 Conjunto 10", expected: true },
    { text: "SMPW Quadra 5 Conjunto 2", expected: true },
    { text: "Setor Comercial Sul Quadra 2", expected: true },
    { text: "Arniqueiras Conjunto 4", expected: true },
    { text: "Rua das Flores 123", expected: true },
    { text: "Av. Paulista 1000", expected: true },
    { text: "Alameda dos Anjos", expected: false }, // No number -> false (Acceptable False Negative)
    { text: "Travessa do Ouvidor", expected: false }, // No number -> false
    { text: "Não informo meu endereço", expected: false },
    { text: "Tenho 20 anos", expected: false },
    { text: "O valor do lote é alto", expected: false },
    { text: "Quadra de esportes", expected: false },
    { text: "Moro no lote vazio", expected: false },
    { text: "Avenida movimentada", expected: false },
    { text: "Rua sem saida", expected: false },
];

let passed = 0;
let failed = 0;

console.log("Running Address Regex Tests...");

testCases.forEach((tc) => {
    const matched = addressRegex.test(tc.text);
    const result = matched === tc.expected;
    if (result) {
        passed++;
        console.log(`[PASS] "${tc.text}" -> ${matched}`);
    } else {
        failed++;
        console.error(`[FAIL] "${tc.text}" -> Expected ${tc.expected}, got ${matched}`);
    }
});

console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
