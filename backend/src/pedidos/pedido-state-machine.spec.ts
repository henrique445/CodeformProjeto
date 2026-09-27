import { isTransicaoValida, getTransicoesPossiveis } from './pedido-state-machine';

describe('PedidoStateMachine', () => {
  describe('isTransicaoValida', () => {
    it('permite transição de PROTOCOLADO para EM_ANALISE', () => {
      expect(isTransicaoValida('PROTOCOLADO', 'EM_ANALISE')).toBe(true);
    });

    it('permite transição de PROTOCOLADO para CANCELADO', () => {
      expect(isTransicaoValida('PROTOCOLADO', 'CANCELADO')).toBe(true);
    });

    it('nao permite transição de PROTOCOLADO para CONCLUIDO (pula etapas)', () => {
      expect(isTransicaoValida('PROTOCOLADO', 'CONCLUIDO')).toBe(false);
    });

    it('nao permite transição de EM_ANALISE de volta para PROTOCOLADO', () => {
      expect(isTransicaoValida('EM_ANALISE', 'PROTOCOLADO')).toBe(false);
    });

    it('permite ida e volta entre EM_ANALISE e EM_EXIGENCIA', () => {
      expect(isTransicaoValida('EM_ANALISE', 'EM_EXIGENCIA')).toBe(true);
      expect(isTransicaoValida('EM_EXIGENCIA', 'EM_ANALISE')).toBe(true);
    });

    it('nao permite nenhuma transição a partir de CONCLUIDO (estado final)', () => {
      expect(isTransicaoValida('CONCLUIDO', 'EM_ANALISE')).toBe(false);
      expect(isTransicaoValida('CONCLUIDO', 'CANCELADO')).toBe(false);
    });

    it('nao permite nenhuma transição a partir de CANCELADO (estado final)', () => {
      expect(isTransicaoValida('CANCELADO', 'PROTOCOLADO')).toBe(false);
      expect(isTransicaoValida('CANCELADO', 'EM_ANALISE')).toBe(false);
    });

    it('nao permite transição para o mesmo estado', () => {
      expect(isTransicaoValida('EM_ANALISE', 'EM_ANALISE')).toBe(false);
    });
  });

  describe('getTransicoesPossiveis', () => {
    it('retorna lista vazia para estados finais', () => {
      expect(getTransicoesPossiveis('CONCLUIDO')).toEqual([]);
      expect(getTransicoesPossiveis('CANCELADO')).toEqual([]);
    });

    it('retorna as transições corretas a partir de PROTOCOLADO', () => {
      expect(getTransicoesPossiveis('PROTOCOLADO')).toEqual([
        'EM_ANALISE',
        'CANCELADO',
      ]);
    });
  });
});