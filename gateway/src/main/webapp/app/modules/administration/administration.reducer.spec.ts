import axios from 'axios';
import sinon from 'sinon';

import administration, { getGatewayRoutes } from './administration.reducer';

describe('Administration reducer tests', () => {
  function isEmpty(element): boolean {
    if (element instanceof Array) {
      return element.length === 0;
    }
    return Object.keys(element).length === 0;
  }

  function testInitialState(state) {
    expect(state).toMatchObject({
      loading: false,
      errorMessage: null,
      totalItems: 0,
    });
    expect(isEmpty(state.gateway.routes));
  }

  function testMultipleTypes(types, payload, testFunction, error?) {
    types.forEach(e => {
      testFunction(administration(undefined, { type: e, payload, error }));
    });
  }

  describe('Common', () => {
    it('should return the initial state', () => {
      testInitialState(administration(undefined, { type: '' }));
    });
  });

  describe('Requests', () => {
    it('should set state to loading', () => {
      testMultipleTypes([getGatewayRoutes.pending.type], {}, state => {
        expect(state).toMatchObject({
          errorMessage: null,
          loading: true,
        });
      });
    });
  });

  describe('Failures', () => {
    it('should set state to failed and put an error message in errorMessage', () => {
      testMultipleTypes(
        [getGatewayRoutes.rejected.type],
        'something happened',
        state => {
          expect(state).toMatchObject({
            loading: false,
            errorMessage: 'error',
          });
        },
        {
          message: 'error',
        },
      );
    });
  });

  describe('Success', () => {
    it('should update state according to a successful fetch gateway routes request', () => {
      const payload = { data: [] };
      const toTest = administration(undefined, { type: getGatewayRoutes.fulfilled.type, payload });

      expect(toTest).toMatchObject({
        loading: false,
        gateway: { routes: payload.data },
      });
    });
  });
  describe('Actions', () => {
    const resolvedObject = { value: 'whatever' };
    const getState = jest.fn();
    const dispatch = jest.fn();
    const extra = {};
    beforeEach(() => {
      axios.get = sinon.stub().returns(Promise.resolve(resolvedObject));
      axios.post = sinon.stub().returns(Promise.resolve(resolvedObject));
    });
    it('dispatches FETCH_GATEWAY_ROUTE_PENDING and FETCH_GATEWAY_ROUTE_FULFILLED actions', async () => {
      const result = await getGatewayRoutes()(dispatch, getState, extra);

      const pendingAction = dispatch.mock.calls[0][0];
      expect(pendingAction.meta.requestStatus).toBe('pending');
      expect(getGatewayRoutes.fulfilled.match(result)).toBe(true);
      expect(result.payload).toBe(resolvedObject);
    });
  });
});
