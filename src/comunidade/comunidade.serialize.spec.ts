import serializeComunidadeResponse from './comunidade.serialize.js';

describe('serializeComunidadeResponse - carismas', () => {
  const baseComunidade = {
    id: 1,
    numeroDaComunidade: 1,
    quantidadeMembros: 10,
    observacao: null,
    etapa: null,
    comunidadeEtapas: [],
    paroquia: {
      id: 1,
      descricao: 'Paróquia Teste',
      endereco: null,
      diocese: {
        id: 1,
        descricao: 'Diocese',
        tipoDioceseId: 1,
        tipoDiocese: { id: 1, descricao: 'Arquidiocese' },
        endereco: null,
      },
    },
  };

  const mapaPessoas = new Map([
    ['uuid-joao', { id: 2, externalId: 'uuid-joao', nome: 'João' }],
    ['uuid-maria', { id: 3, externalId: 'uuid-maria', nome: 'Maria' }],
    ['uuid-pedro', { id: 4, externalId: 'uuid-pedro', nome: 'Pedro' }],
  ]);

  const pessoaResponsavel =
    (id, externalId, carisma) =>
    ({
      id,
      externalId,
      pessoaCarismas: [carisma],
      casamentosComoMarido: [],
      casamentosComoMulher: [],
    });

  it('produz o array carismas agregado por carisma com pessoas preenchidas', () => {
    const responsavel = {
      id: 1,
      descricao: 'Responsável',
      tipo: 'VINCULADO',
      casalAndaJunto: true,
    };
    const coResponsavel = {
      id: 11,
      descricao: 'Co-Responsável',
      tipo: 'VINCULADO',
      casalAndaJunto: true,
    };

    const comunidade = {
      ...baseComunidade,
      comunidadePessoas: [
        {
          pessoa: pessoaResponsavel(2, 'uuid-joao', {
            carisma: responsavel,
          }),
        },
        {
          pessoa: pessoaResponsavel(3, 'uuid-maria', {
            carisma: coResponsavel,
          }),
        },
      ],
    };

    const result = serializeComunidadeResponse(comunidade, mapaPessoas);

    expect(Array.isArray(result.carismas)).toBe(true);
    expect(result.carismas).toHaveLength(2);

    const res = result.carismas.find((c) => c.id === 1);
    expect(res).toMatchObject({ id: 1, descricao: 'Responsável', tipo: 'VINCULADO' });
    expect(res.pessoas).toHaveLength(1);
    expect(res.pessoas[0]).toMatchObject({
      id: 2,
      externalId: 'uuid-joao',
      nome: 'João',
      casal: false,
    });
    expect(res.pessoas[0].conjugue).toBeUndefined();

    const coRes = result.carismas.find((c) => c.id === 11);
    expect(coRes).toMatchObject({ id: 11, descricao: 'Co-Responsável', tipo: 'VINCULADO' });
    expect(coRes.pessoas).toHaveLength(1);
    expect(coRes.pessoas[0]).toMatchObject({
      id: 3,
      externalId: 'uuid-maria',
      nome: 'Maria',
      casal: false,
    });
  });

  it('marca casal e preenche conjugue quando a pessoa tem cônjuge e o carisma anda em casal', () => {
    const coResponsavel = {
      id: 11,
      descricao: 'Co-Responsável',
      tipo: 'VINCULADO',
      casalAndaJunto: true,
    };

    // Maria é a mulher do casal (id 3); seu marido é o Pedro (id 4).
    // Regra: o marido vira a pessoa principal e a mulher entra em `conjugue`.
    const maria = {
      id: 3,
      externalId: 'uuid-maria',
      pessoaCarismas: [{ carisma: coResponsavel }],
      casamentosComoMarido: [],
      casamentosComoMulher: [
        { marido: { id: 4, externalId: 'uuid-pedro' }, mulher: null },
      ],
    };

    const comunidade = {
      ...baseComunidade,
      comunidadePessoas: [{ pessoa: maria }],
    };

    const result = serializeComunidadeResponse(comunidade, mapaPessoas);

    const coRes = result.carismas.find((c) => c.id === 11);
    expect(coRes.pessoas).toHaveLength(1);
    expect(coRes.pessoas[0]).toMatchObject({
      id: 4,
      externalId: 'uuid-pedro',
      nome: 'Pedro',
      casal: true,
    });
    expect(coRes.pessoas[0].conjugue).toEqual({
      id: 3,
      externalId: 'uuid-maria',
      nome: 'Maria',
    });
  });

  it('gera um único item por casal quando marido e mulher possuem o mesmo carisma', () => {
    const catequistas = {
      id: 13,
      descricao: 'Catequistas',
      tipo: 'VINCULADO',
      casalAndaJunto: true,
    };

    const joao = {
      id: 2,
      externalId: 'uuid-joao',
      pessoaCarismas: [{ carisma: catequistas }],
      casamentosComoMarido: [
        { marido: null, mulher: { id: 3, externalId: 'uuid-maria' } },
      ],
      casamentosComoMulher: [],
    };

    const maria = {
      id: 3,
      externalId: 'uuid-maria',
      pessoaCarismas: [{ carisma: catequistas }],
      casamentosComoMarido: [],
      casamentosComoMulher: [
        { marido: { id: 2, externalId: 'uuid-joao' }, mulher: null },
      ],
    };

    const comunidade = {
      ...baseComunidade,
      comunidadePessoas: [{ pessoa: joao }, { pessoa: maria }],
    };

    const result = serializeComunidadeResponse(comunidade, mapaPessoas);

    const cat = result.carismas.find((c) => c.id === 13);
    expect(cat.pessoas).toHaveLength(1);
    expect(cat.pessoas[0]).toMatchObject({
      id: 2,
      externalId: 'uuid-joao',
      nome: 'João',
      casal: true,
    });
    expect(cat.pessoas[0].conjugue).toEqual({
      id: 3,
      externalId: 'uuid-maria',
      nome: 'Maria',
    });
  });

  it('não marca casal quando a pessoa tem cônjuge mas o carisma não anda em casal', () => {
    const salmista = {
      id: 12,
      descricao: 'Salmista',
      tipo: 'VINCULADO',
      casalAndaJunto: false,
    };

    const maria = {
      id: 3,
      externalId: 'uuid-maria',
      pessoaCarismas: [{ carisma: salmista }],
      casamentosComoMarido: [],
      casamentosComoMulher: [
        { marido: { id: 4, externalId: 'uuid-pedro' }, mulher: null },
      ],
    };

    const comunidade = {
      ...baseComunidade,
      comunidadePessoas: [{ pessoa: maria }],
    };

    const result = serializeComunidadeResponse(comunidade, mapaPessoas);

    const sal = result.carismas.find((c) => c.id === 12);
    expect(sal.pessoas[0].casal).toBe(false);
    expect(sal.pessoas[0].conjugue).toBeUndefined();
  });

  it('retorna carismas como array vazio quando a comunidade não possui pessoas com carisma', () => {
    const comunidade = {
      ...baseComunidade,
      comunidadePessoas: [
        {
          pessoa: pessoaResponsavel(5, 'uuid-sem-carisma', {}),
        },
      ],
    };

    const result = serializeComunidadeResponse(comunidade, mapaPessoas);

    expect(result.carismas).toEqual([]);
  });

  it('retorna carismas como array vazio quando não há comunidadePessoas no retorno (ex.: findAll)', () => {
    const result = serializeComunidadeResponse(baseComunidade);

    expect(result.carismas).toEqual([]);
  });
});