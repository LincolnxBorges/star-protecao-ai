-- =====================================================
-- SEED: PRICING RULES (Baseado na planilha fornecida)
-- =====================================================

-- Limpar dados existentes
TRUNCATE TABLE pricing_rules CASCADE;
TRUNCATE TABLE blacklist CASCADE;

-- =====================================================
-- CATEGORIA: NORMAL (Veículos leves - uso particular)
-- =====================================================
INSERT INTO pricing_rules (categoria, faixa_min, faixa_max, mensalidade) VALUES
('NORMAL', 0, 10000.00, 95.00),
('NORMAL', 10000.01, 20000.00, 117.27),
('NORMAL', 20000.01, 30000.00, 143.29),
('NORMAL', 30000.01, 40000.00, 168.29),
('NORMAL', 40000.01, 50000.00, 201.67),
('NORMAL', 50000.01, 60000.00, 226.32),
('NORMAL', 60000.01, 70000.00, 248.23),
('NORMAL', 70000.01, 80000.00, 271.05),
('NORMAL', 80000.01, 90000.00, 300.12),
('NORMAL', 90000.01, 100000.00, 325.95),
('NORMAL', 100000.01, 110000.00, 351.78),
('NORMAL', 110000.01, 120000.00, 377.61),
('NORMAL', 120000.01, 130000.00, 403.43),
('NORMAL', 130000.01, 140000.00, 429.26),
('NORMAL', 140000.01, 150000.00, 455.09),
('NORMAL', 150000.01, 160000.00, 480.92),
('NORMAL', 160000.01, 170000.00, 506.75),
('NORMAL', 170000.01, 180000.00, 532.58),
('NORMAL', 180000.01, 999999999.99, 558.41); -- Último range (acima do limite)

-- =====================================================
-- CATEGORIA: ESPECIAL (Veículos leves - uso comercial)
-- =====================================================
INSERT INTO pricing_rules (categoria, faixa_min, faixa_max, mensalidade) VALUES
('ESPECIAL', 0, 20000.00, 151.04),
('ESPECIAL', 20000.01, 30000.00, 194.91),
('ESPECIAL', 30000.01, 40000.00, 222.37),
('ESPECIAL', 40000.01, 50000.00, 259.43),
('ESPECIAL', 50000.01, 60000.00, 284.13),
('ESPECIAL', 60000.01, 70000.00, 322.57),
('ESPECIAL', 70000.01, 80000.00, 363.75),
('ESPECIAL', 80000.01, 90000.00, 413.75),
('ESPECIAL', 90000.01, 100000.00, 463.75),
('ESPECIAL', 100000.01, 110000.00, 513.75),
('ESPECIAL', 110000.01, 120000.00, 563.75),
('ESPECIAL', 120000.01, 130000.00, 613.75),
('ESPECIAL', 130000.01, 140000.00, 663.75),
('ESPECIAL', 140000.01, 150000.00, 713.75),
('ESPECIAL', 150000.01, 160000.00, 763.75),
('ESPECIAL', 160000.01, 170000.00, 813.75),
('ESPECIAL', 170000.01, 180000.00, 863.75),
('ESPECIAL', 180000.01, 190000.00, 913.75),
('ESPECIAL', 190000.01, 999999999.99, 963.75); -- Último range (acima do limite)

-- =====================================================
-- CATEGORIA: UTILITARIO (SUVs, Caminhonetes, Vans)
-- =====================================================
INSERT INTO pricing_rules (categoria, faixa_min, faixa_max, mensalidade) VALUES
('UTILITARIO', 0, 25000.00, 124.20),
('UTILITARIO', 25000.01, 50000.00, 184.14),
('UTILITARIO', 50000.01, 75000.00, 235.65),
('UTILITARIO', 75000.01, 100000.00, 283.39),
('UTILITARIO', 100000.01, 125000.00, 353.74),
('UTILITARIO', 125000.01, 150000.00, 424.09),
('UTILITARIO', 150000.01, 175000.00, 495.00),
('UTILITARIO', 175000.01, 200000.00, 566.00),
('UTILITARIO', 200000.01, 225000.00, 637.00),
('UTILITARIO', 225000.01, 250000.00, 708.00),
('UTILITARIO', 250000.01, 275000.00, 760.49),
('UTILITARIO', 275000.01, 300000.00, 825.83),
('UTILITARIO', 300000.01, 325000.00, 891.17),
('UTILITARIO', 325000.01, 350000.00, 956.51),
('UTILITARIO', 350000.01, 375000.00, 1021.85),
('UTILITARIO', 375000.01, 400000.00, 1087.19),
('UTILITARIO', 400000.01, 425000.00, 1152.53),
('UTILITARIO', 425000.01, 450000.00, 1217.87),
('UTILITARIO', 450000.01, 999999999.99, 1283.22); -- Último range (acima do limite)

-- =====================================================
-- CATEGORIA: MOTO (Motocicletas)
-- =====================================================
INSERT INTO pricing_rules (categoria, faixa_min, faixa_max, mensalidade) VALUES
('MOTO', 0, 6000.00, 79.35),
('MOTO', 6000.01, 10000.00, 104.94),
('MOTO', 10000.01, 16000.00, 129.29),
('MOTO', 16000.01, 20000.00, 159.00),
('MOTO', 20000.01, 26000.00, 189.00),
('MOTO', 26000.01, 30000.00, 214.32),
('MOTO', 30000.01, 36000.00, 249.00),
('MOTO', 36000.01, 40000.00, 279.00),
('MOTO', 40000.01, 46000.00, 309.00),
('MOTO', 46000.01, 50000.00, 339.00),
('MOTO', 50000.01, 56000.00, 369.00),
('MOTO', 56000.01, 60000.00, 399.00),
('MOTO', 60000.01, 66000.00, 429.00),
('MOTO', 66000.01, 70000.00, 459.00),
('MOTO', 70000.01, 76000.00, 489.00),
('MOTO', 76000.01, 80000.00, 519.00),
('MOTO', 80000.01, 86000.00, 549.00),
('MOTO', 86000.01, 90000.00, 579.00),
('MOTO', 90000.01, 999999999.99, 609.00); -- Último range (acima do limite)

-- =====================================================
-- BLACKLIST: MARCAS COMPLETAS
-- =====================================================
INSERT INTO blacklist (marca, modelo, motivo) VALUES
('AUDI', NULL, 'Não trabalhamos com esta marca'),
('BMW', NULL, 'Não trabalhamos com esta marca'),
('MERCEDES-BENZ', NULL, 'Não trabalhamos com esta marca'),
('MERCEDES', NULL, 'Não trabalhamos com esta marca'), -- Variação do nome
('VOLVO', NULL, 'Não trabalhamos com esta marca'),
('LEXUS', NULL, 'Não trabalhamos com esta marca'),
('JAGUAR', NULL, 'Não trabalhamos com esta marca'),
('PORSCHE', NULL, 'Não trabalhamos com esta marca'),
('LAND ROVER', NULL, 'Não trabalhamos com esta marca'),
('LAND-ROVER', NULL, 'Não trabalhamos com esta marca'); -- Variação do nome

-- =====================================================
-- BLACKLIST: MODELOS ESPECÍFICOS
-- =====================================================
INSERT INTO blacklist (marca, modelo, motivo) VALUES
('FORD', 'FOCUS', 'Não trabalhamos com este modelo'),
('FORD', 'FUSION', 'Não trabalhamos com este modelo'),
('CITROEN', 'CACTUS', 'Não trabalhamos com este modelo'),
('CITROËN', 'CACTUS', 'Não trabalhamos com este modelo'), -- Variação com acento
('HYUNDAI', 'ELANTRA', 'Não trabalhamos com este modelo'),
('HONDA', 'ACCORD', 'Não trabalhamos com este modelo');

-- =====================================================
-- CONFIGURAÇÃO ROUND-ROBIN
-- =====================================================
INSERT INTO round_robin_config (current_index) VALUES (0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT categoria, COUNT(*) as faixas, MIN(mensalidade) as menor, MAX(mensalidade) as maior
FROM pricing_rules
GROUP BY categoria
ORDER BY categoria;

SELECT marca, modelo, motivo FROM blacklist ORDER BY marca, modelo;
