/* eslint-disable @typescript-eslint/no-explicit-any */
import { Comunidade } from 'neocatecumenal';

export interface PessoaExternaResolvida {
  id: number;
  externalId: string;
  nome: string;
}

export type MapaPessoasExternas = Map<string, PessoaExternaResolvida>;

/**
 * Serializa a comunidade no contrato `Comunidade` de `neocatecumenal`.
 * Quando `comunidade.comunidadePessoas` está presente (preenchido pelo include
 * do `findOne`), monta também o atributo `carismas`, agregando as pessoas da
 * comunidade por carisma e usando `mapaPessoasExternas` (externalId → dados
 * externos) para resolver `nome`/`conjugue`.
 */
export default function serializeComunidadeResponse(
  comunidade: any,
  mapaPessoasExternas?: MapaPessoasExternas,
): Comunidade {
  return {
    id: comunidade.id,
    numeroDaComunidade: comunidade.numeroDaComunidade,
    quantidadeMembros: comunidade.quantidadeMembros,
    observacao: comunidade.observacao,
    etapaAtual: comunidade.etapa,
    comunidadeEtapas: comunidade.comunidadeEtapas.map((etapa) => ({
      id: etapa.id,
      etapaId: etapa.etapaId,
      etapa: etapa.etapa,
      comunidadeId: etapa.comunidadeId,
      dataInicio: etapa.dataInicio,
      dataFim: etapa.dataFim,
      localConvivencia: etapa.localConvivencia,
      equipe: etapa.equipe
        ? {
            id: etapa.equipe.id,
            descricao: etapa.equipe.descricao,
            tipoEquipeId: etapa.equipe.tipoEquipeId,
            observacao: etapa.equipe.observacao,
            createdAt: etapa.equipe.createdAt,
            updatedAt: etapa.equipe.updatedAt,
            tipoEquipe: null,
            pessoas: [],
          }
        : null,
      observacao: etapa.observacao,
    })),
    paroquia: {
      id: comunidade.paroquia.id,
      descricao: comunidade.paroquia.descricao,
      endereco: comunidade.paroquia.endereco,
      setor: null,
      diocese: {
        id: comunidade.paroquia.diocese.id,
        descricao: comunidade.paroquia.diocese.descricao,
        tipoDiocese: {
          id: comunidade.paroquia.diocese.tipoDioceseId,
          descricao: comunidade.paroquia.diocese.tipoDiocese.descricao,
        },
        endereco: comunidade.paroquia.diocese.endereco,
      },
    },
    carismas: serializeCarismas(comunidade, mapaPessoasExternas),
  };
}

/**
 * Monta o array `carismas` da comunidade a partir das pessoas vinculadas
 * (`comunidade.comunidadePessoas`). Sem pessoas com carisma, retorna `[]`.
 *
 * Para carismas que andam em casal (`casalAndaJunto: true`), gera um único
 * item por casal: o **marido** como pessoa e a **mulher** em `conjugue`
 * (mesmo quando só um dos dois possui o carisma).
 */
function serializeCarismas(
  comunidade: any,
  mapaPessoasExternas?: MapaPessoasExternas,
): any[] {
  const pessoasDaComunidade = (comunidade?.comunidadePessoas || []).filter(
    (vinculo) => vinculo?.dataSaida == null,
  );
  const porCarisma = new Map<
    number,
    { entry: any; pessoas: any[]; chaves: Set<string> }
  >();

  for (const vinculo of pessoasDaComunidade) {
    const pessoa = vinculo?.pessoa;
    if (!pessoa) continue;

    for (const pessoaCarisma of pessoa.pessoaCarismas || []) {
      const carisma = pessoaCarisma?.carisma;
      if (!carisma) continue;

      let grupo = porCarisma.get(carisma.id);
      if (!grupo) {
        grupo = {
          entry: {
            id: carisma.id,
            descricao: carisma.descricao,
            tipo: carisma.tipo,
          },
          pessoas: [],
          chaves: new Set<string>(),
        };
        porCarisma.set(carisma.id, grupo);
      }

      const item = montarPessoaDoCarisma(
        pessoa,
        carisma,
        grupo.chaves,
        mapaPessoasExternas,
      );
      if (item) {
        grupo.pessoas.push(item);
      }
    }
  }

  return Array.from(porCarisma.values()).map((g) => ({
    ...g.entry,
    pessoas: g.pessoas,
  }));
}

/**
 * Monta o item de `pessoas` para uma pessoa que possui o carisma.
 * Em carismas de casal, o marido vira a pessoa principal e a mulher o
 * `conjugue`, deduplicando o casal. Retorna `null` quando o casal já foi
 * incluído por outro parceiro.
 */
function montarPessoaDoCarisma(
  pessoa: any,
  carisma: any,
  chaves: Set<string>,
  mapaPessoasExternas?: MapaPessoasExternas,
): any {
  const nomeDe = (p: any): string =>
    p?.externalId
      ? (mapaPessoasExternas?.get(p.externalId)?.nome ?? '')
      : '';

  if (carisma.casalAndaJunto === true) {
    const casal = resolverCasal(pessoa);
    if (casal) {
      const chave = `casal-${casal.marido.id}-${casal.mulher.id}`;
      if (chaves.has(chave)) return null;
      chaves.add(chave);

      return {
        id: casal.marido.id,
        externalId: casal.marido.externalId,
        nome: nomeDe(casal.marido),
        casal: true,
        conjugue: {
          id: casal.mulher.id,
          externalId: casal.mulher.externalId,
          nome: nomeDe(casal.mulher),
        },
      };
    }
  }

  const chave = `pessoa-${pessoa.id}`;
  if (chaves.has(chave)) return null;
  chaves.add(chave);

  return {
    id: pessoa.id,
    externalId: pessoa.externalId,
    nome: nomeDe(pessoa),
    casal: false,
  };
}

/**
 * Resolve o casal de uma pessoa através da relação `pessoaCasal`, sempre
 * retornando o marido e a mulher (independente de quem é a pessoa em si).
 * A pessoa pode ser marido em `casamentosComoMarido` ou mulher em
 * `casamentosComoMulher`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolverCasal(
  pessoa: any,
): { marido: any; mulher: any } | null {
  const comoMarido = pessoa?.casamentosComoMarido?.[0];
  if (comoMarido?.mulher) {
    return { marido: pessoa, mulher: comoMarido.mulher };
  }

  const comoMulher = pessoa?.casamentosComoMulher?.[0];
  if (comoMulher?.marido) {
    return { marido: comoMulher.marido, mulher: pessoa };
  }

  return null;
}