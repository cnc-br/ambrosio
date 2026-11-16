import { ENDERECO_INCLUDE, PESSOA_CARISMA_INCLUDE } from 'src/prisma/includes.js';
import { PAROQUIA_SELECT } from 'src/prisma/selects/paroquia.select.js';

// Formas de consulta do agregado pessoa usadas pelos fluxos de detalhe,
// listagem e busca de cônjuge. Mantidas aqui para que os serviços não
// conheçam o formato de persistência.

export const PESSOA_LISTAGEM_INCLUDE = {
  situacaoReligiosa: true,
  pessoaCarismas: PESSOA_CARISMA_INCLUDE,
  enderecos: {
    include: {
      endereco: ENDERECO_INCLUDE,
    },
  },
} as const;

export const PESSOA_DETALHE_INCLUDE = {
  situacaoReligiosa: true,
  pessoaCarismas: PESSOA_CARISMA_INCLUDE,
  comunidadePessoas: {
    include: {
      comunidade: {
        include: {
          paroquia: {
            select: PAROQUIA_SELECT,
          },
        },
      },
    },
  },
  enderecos: {
    include: {
      endereco: ENDERECO_INCLUDE,
    },
  },
} as const;

export const PESSOA_BASICA_SELECT = {
  id: true,
  externalId: true,
} as const;