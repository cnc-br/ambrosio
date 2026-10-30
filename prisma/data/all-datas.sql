INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(1, 'Vocacionado(a)', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(2, 'Religioso(a)', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(3, 'Familia em Missão', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(4, 'Irmãos/Irmãs em Missão', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(5, 'Irmãos/Irmãs Itinerantes', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(6, 'Familia Itinerante', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(7, 'Pós Crisma', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(8, 'Presbítero', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(9, 'Freira', 'PRIMITIVO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(10, 'Responsável', 'VINCULADO', true);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(11, 'Co-Responsável', 'VINCULADO', true);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(12, 'Salmista', 'VINCULADO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(13, 'Catequistas', 'VINCULADO', true);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(14, 'Leitores', 'VINCULADO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(15, 'Ostiário', 'VINCULADO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(16, 'Mestre', 'VINCULADO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(17, 'Padeiro', 'VINCULADO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(18, 'Secretário', 'SERVICO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(19, 'Voluntário', 'SERVICO', false);
INSERT INTO ambrosio.carisma (id, descricao, tipo, "casalAndaJunto") VALUES(20, 'Convidado', 'SERVICO', false);

INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(1, 'Analfabeto');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(2, 'Ensino Fundamental');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(3, 'Ensino Fundamental Incompleto');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(4, 'Ensino Médio');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(5, 'Ensino Médio Incompleto');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(6, 'Ensino Superior');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(7, 'Ensino Superior Incompleto');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(8, 'Pos Graduação');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(9, 'Mestrado');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(10, 'Douturado');
INSERT INTO ambrosio.escolaridade (id, descricao) VALUES(11, 'Pos Doutorado');

INSERT INTO ambrosio."estadoCivil" (id, descricao) VALUES(1, 'SOLTEIRO(A)');
INSERT INTO ambrosio."estadoCivil" (id, descricao) VALUES(2, 'CASADO(A)');
INSERT INTO ambrosio."estadoCivil" (id, descricao) VALUES(3, 'VIUVO(A)');
INSERT INTO ambrosio."estadoCivil" (id, descricao) VALUES(4, 'DIVORCIADO(A)');
INSERT INTO ambrosio."estadoCivil" (id, descricao) VALUES(5, 'NAO_INFORMADO');

INSERT INTO ambrosio.etapa (id, descricao) VALUES(1, 'pre-catecumenato');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(2, '1º escrutinio');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(3, 'Shemá Israel');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(4, '2º escrutinio');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(5, 'Iniciação a Oração');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(6, 'Tradditio Symboli');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(7, 'Redditio Symboli');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(8, 'Pai Nosso I');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(9, 'Pai Nosso II');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(10, 'Pai Nosso III');
INSERT INTO ambrosio.etapa (id, descricao) VALUES(11, '3º escrutinio');

INSERT INTO ambrosio.pais (id, "isoAlpha2", nome, regiao, "subRegiao", "regiaoIntermediaria", lingua, capital) VALUES(1, 'BR', 'Brasil', 'América', 'América Latina e Caribe', 'América do sul', 'portugues', 'Brasília');
INSERT INTO ambrosio.pais (id, "isoAlpha2", nome, regiao, "subRegiao", "regiaoIntermediaria", lingua, capital) VALUES(2, 'PE', 'Peru', 'América', 'América Latina e Caribe', 'América do sul', 'aimará', 'Lima');

INSERT INTO ambrosio."macroRegiao" (id, descricao, ativo) VALUES(1, 'Franca', true);
INSERT INTO ambrosio."macroRegiao" (id, descricao, ativo) VALUES(2, 'Brasília', true);
INSERT INTO ambrosio."macroRegiao" (id, descricao, ativo) VALUES(3, 'Goiás', true);

INSERT INTO ambrosio.regiao (id, descricao, "macroRegiaoId", ativo) VALUES(1, 'Franca', 1, true);
INSERT INTO ambrosio.regiao (id, descricao, "macroRegiaoId", ativo) VALUES(2, 'Ceará', 2, true);
INSERT INTO ambrosio.regiao (id, descricao, "macroRegiaoId", ativo) VALUES(3, 'Piauí', 3, true);
INSERT INTO ambrosio.regiao (id, descricao, "macroRegiaoId", ativo) VALUES(4, 'Campo Limpo', 1, true);

INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(1, 'Anhaguera - Setor 1', true, 1);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(2, 'Anhaguera - Setor 2', true, 1);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(3, 'Portinari - Setor 1', true, 1);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(4, 'Portinari - Setor 2', true, 1);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(5, 'Brasilia - Setor 1', true, 2);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(6, 'Brasilia - Setor 2', true, 2);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(7, 'Brasilia - Setor 3', true, 2);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(8, 'Brasilia - Setor 4', true, 2);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(9, 'Brasilia - Setor 5', true, 2);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(10, 'Centro Oeste - GO 1', true, 3);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(11, 'Centro Oeste - GO 2', true, 3);
INSERT INTO ambrosio.setor (id, descricao, ativo, "regiaoId") VALUES(12, 'Centro Oeste - GO 3', true, 3);

INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(1, 'Leigo', NULL);
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(2, 'Seminarista', 'MASCULINO');
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(3, 'Religioso(a)', NULL);
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(4, 'Diácono', 'MASCULINO');
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(5, 'Diácono Permanente', 'MASCULINO');
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(6, 'Presbítero', 'MASCULINO');
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(7, 'Bispo', 'MASCULINO');
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(8, 'Arcebispo', 'MASCULINO');
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(9, 'Cardeal', 'MASCULINO');
INSERT INTO ambrosio."situacaoReligiosa" (id, descricao, "sexoUnico") VALUES(10, 'Papa', 'MASCULINO');

INSERT INTO ambrosio."tipoDiocese" (id, descricao) VALUES(1, 'Arquidiocese');
INSERT INTO ambrosio."tipoDiocese" (id, descricao) VALUES(2, 'Diocese');
INSERT INTO ambrosio."tipoDiocese" (id, descricao) VALUES(3, 'Prelazia');

INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(1, 'Catequista');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(2, 'Catequista Regional');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(3, 'Catequista Itinerante');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(4, 'Secretários Centro Neocatecumenal');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(5, 'Peregrinações Jovens');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(6, 'Perscrutação Jovens');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(7, 'Pós-Crisma');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(8, 'Responsável GRANDE REGIAO');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(9, 'Vocacional - Moças');
INSERT INTO ambrosio."tipoEquipe" (id, descricao) VALUES(10, 'Vocacional - Moços');