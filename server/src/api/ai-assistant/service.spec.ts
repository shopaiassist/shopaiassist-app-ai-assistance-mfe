import { expect } from 'chai';
import sinon from 'sinon';
import { LOG } from 'react';
import { AIAssistantService, DEFAULT_REGION } from './service';

describe('AIAssistantService', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    sandbox = sinon.createSandbox();
    sandbox.stub(LOG, 'debug');
  });

  afterEach(() => {
    process.env = originalEnv;
    sandbox.restore();
  });

  const mockEnv: { [key: string]: string } = {
    us: 'http://us.example.com',
  };

  const setupEnv = () => {
    process.env.BACKEND_SERVICE_URL_REGIONS = JSON.stringify(mockEnv);
  };

  describe('getBackendUrl', () => {
    it('returns the correct backend URL for the given region', () => {
      setupEnv();
      const url = AIAssistantService.getBackendUrl('eu');
      expect(url).to.equal('http://eu.example.com');
    });

    it('returns the correct backend URL for the default region when no region is provided', () => {
      setupEnv();
      const url = AIAssistantService.getBackendUrl();
      expect(url).to.equal(mockEnv[DEFAULT_REGION]);
    });
  });
});
