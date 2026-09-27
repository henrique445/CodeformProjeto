import {
  isTransicaoValida,
  getTransicoesPossiveis,
} from './pedido-state-machine';

describe('PedidoStateMachine', () => {
  describe('isTransicaoValida', () => {
    it('permite PROTOCOLADO → EM_ANALISE', () => {
      expect(
        isTransicaoValida('PROTOCOLADO', 'EM_ANALISE')
      ).toBe(true);
    });

    it('permite PROTOCOLADO → CANCELADO', () => {
      expect(
        isTransicaoValida('PROTOCOLADO', 'CANCELADO')
      ).toBe(true);
    });

    it('não permite pular de PROTOCOLADO → CONCLUIDO', () => {
      expect(
        isTransicaoValida('PROTOCOLADO', 'CONCLUIDO')
      ).toBe(false);
    });

    it('não permite voltar de EM_ANALISE → PROTOCOLADO', () => {
      expect(
        isTransicaoValida('EM_ANALISE', 'PROTOCOLADO')
      ).toBe(false);
    });

    it('permite EM_ANALISE ↔ EM_EXIGENCIA', () => {
      expect(
        isTransicaoValida('EM_ANALISE', 'EM_EXIGENCIA')
      ).toBe(true);

      expect(
        isTransicaoValida('EM_EXIGENCIA', 'EM_ANALISE')
      ).toBe(true);
    });

    it('não permite mudanças depois de CONCLUIDO', () => {
      expect(
        isTransicaoValida('CONCLUIDO', 'EM_ANALISE')
      ).toBe(false);

      expect(
        isTransicaoValida('CONCLUIDO', 'CANCELADO')
      ).toBe(false);
    });

    it('não permite mudanças depois de CANCELADO', () => {
      expect(
        isTransicaoValida('CANCELADO', 'PROTOCOLADO')
      ).toBe(false);

      expect(
        isTransicaoValida('CANCELADO', 'EM_ANALISE')
      ).toBe(false);
    });

    it('não permite mudar para o mesmo status', () => {
      expect(
        isTransicaoValida('EM_ANALISE', 'EM_ANALISE')
      ).toBe(false);
    });
  });

  describe('getTransicoesPossiveis', () => {
    it('retorna lista vazia para CONCLUIDO', () => {
      expect(
        getTransicoesPossiveis('CONCLUIDO')
      ).toEqual([]);
    });

    it('retorna lista vazia para CANCELADO', () => {
      expect(
        getTransicoesPossiveis('CANCELADO')
      ).toEqual([]);
    });

    it('retorna as opções corretas para PROTOCOLADO', () => {
      expect(
        getTransicoesPossiveis('PROTOCOLADO')
      ).toEqual([
        'EM_ANALISE',
        'CANCELADO',
      ]);
    });
  });
});