/* eslint-disable @typescript-eslint/no-explicit-any */
import { Comunidade, Pessoa, PessoaContato } from 'neocatecumenal';
import { ESTADO_CIVIL_MAP, SEXO_ENUM } from 'src/commons/enums/enums.js';
import { serializeEndereco } from 'src/commons/utils/serializers/serializerEndereco.js';

export function serializePessoaResponse(
  pessoa: any,
  external: Pessoa,
  conjugue?: any,
  contatos?: PessoaContato[],
): Pessoa {
  const comunidade = pessoa.comunidadePessoas?.[0] || null;

  return {
    id: pessoa.id,
    externalId: external.externalId,
    nome: external.nome,
    conhecidoPor: external.conhecidoPor,
    cpf: external.cpf,
    sexo: external.sexo === 'M' ? SEXO_ENUM.MASCULINO : SEXO_ENUM.FEMININO,
    nacionalidade: external.nacionalidade,
    estadoCivil: ESTADO_CIVIL_MAP[external.estadoCivil],
    dataNascimento: external.dataNascimento,
    conjugue,
    contatos,
    comunidade: handleComunidade(comunidade),
    foto: external.foto,
    ativo: pessoa.ativo,
    escolaridade: external.escolaridade,
    situacaoReligiosa: pessoa.situacaoReligiosa,
    carismas: pessoa.pessoaCarismas?.map((pc) => pc.carisma),
    enderecos: pessoa.enderecos?.map(({ endereco }) =>
      serializeEndereco(endereco),
    ),
  };
}

export function serializePessoasListResponse(
  pessoas: any[],
  externals: Pessoa[],
  conjugues?: any[],
): Pessoa[] {
  return pessoas
    .map((pessoa, index) => {
      const external = externals.find(
        (ext) => ext.externalId === pessoa.externalId,
      );
      const conjugue = conjugues?.[index];

      if (!external) {
        // Log ou tratamento quando não encontrar dados externos
        console.warn(
          `Dados externos não encontrados para pessoa ID: ${pessoa.id}`,
        );
        return null;
      }

      return serializePessoaResponse(pessoa, external, conjugue);
    })
    .filter(Boolean); // Remove os nulls do array
}

function handleComunidade(comunidade: any): Comunidade | null {
  if (!comunidade) {
    return null;
  }

  return {
    id: comunidade.comunidadeId,
    numeroDaComunidade: comunidade.comunidade.numeroDaComunidade,
    etapaAtual: comunidade.etapaAtualId,
    quantidadeMembros: comunidade.comunidade.quantidadeMembros,
    observacao: comunidade.comunidade.observacao,
    paroquia: {
      id: comunidade.comunidade.paroquia.id,
      descricao: comunidade.comunidade.paroquia.descricao,
      diocese: {
        id: comunidade.comunidade.paroquia.diocese.id,
        descricao: comunidade.comunidade.paroquia.diocese.descricao,
        endereco: null,
        tipoDiocese: null,
      },
      endereco: comunidade.comunidade.paroquia.endereco,
      setor: comunidade.comunidade.paroquia.setor,
      comunidades: null,
      observacao: null,
    },
    comunidadeEtapas:
      comunidade.comunidade.comunidadeEtapas?.map((etapa) => ({
        id: etapa.id,
        descricao: etapa.descricao,
        equipe: etapa.equipe
          ? {
              id: etapa.equipe.id,
              nome: etapa.equipe.nome,
            }
          : null,
      })) || [],
  };
}
