-- Script para adicionar coluna TIPO_MSG na tabela de comentários
-- Execute no Oracle
ALTER TABLE BRSACC_COMMENTS
ADD (TIPO_MSG CHAR(1) DEFAULT 'M');
COMMENT ON COLUMN BRSACC_COMMENTS.TIPO_MSG IS 'M=Message (Chat), N=Note (Anotação)';
-- Atualiza registros antigos para garantir consistência (opcional, já que o default trata disso)
UPDATE BRSACC_COMMENTS
SET TIPO_MSG = 'M'
WHERE TIPO_MSG IS NULL;
COMMIT;