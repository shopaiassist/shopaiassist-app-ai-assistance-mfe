import express from 'express';
import sinon from 'sinon';
import bodyParser from 'body-parser';
import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';

import { LOG } from '@osia/hades_core';
import { AIAssistantRoutes } from './routes';

chai.use(chaiHttp);
const expect = chai.expect;

describe('AIAssistantRoutes', () => {
  let app: express.Express;
  let sandbox: sinon.SinonSandbox;
  let originalEnv: NodeJS.ProcessEnv;
  const mockBackendUrl = 'http://eu.example.com';

  before(() => (sandbox = sinon.createSandbox()));

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      BACKEND_SERVICE_URL_REGIONS: JSON.stringify({ us: mockBackendUrl }),
    };

    app = express();
    app.use(bodyParser.json());

    app.use(AIAssistantRoutes.routes());

    // suppress debug logs
    sandbox.stub(LOG, 'debug');
  });

  afterEach(() => {
    process.env = originalEnv;
    sandbox.restore();
  });

  describe(`Proxy ${AIAssistantRoutes.PATHS.BACKEND_PROXY}`, () => {
    const expectedBackendUrl = 'http://eu.example.com';
    before(() => {
      nock(expectedBackendUrl).get(`/foo-bar`).reply(200, { qux: 'baz' });
      nock(expectedBackendUrl).get(`/with-cookie`).reply(200, { qux: 'baz' });
    });

    after(() => {
      nock.abortPendingRequests();
      nock.cleanAll();
    });

    it('should proxy requests to the correct backend URL', () => {
      return chai
        .request(app)
        .get(`${AIAssistantRoutes.PATHS.BACKEND_PROXY}/foo-bar`)
        .send()
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.deep.equal({ qux: 'baz' });
        });
    });

    it("should not send the main app's cookies to the backend service", () => {
      return chai
        .request(app)
        .get(`${AIAssistantRoutes.PATHS.BACKEND_PROXY}/with-cookie`)
        .set('Cookie', 'test=cookie')
        .send()
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.not.have.cookie('test');
        });
    });
  });

  describe(`Proxy ${AIAssistantRoutes.PATHS.BACKEND_PROXY}/new_chat/chat/:chatId/user-message`, () => {
    let fetchStub: sinon.SinonStub;
    let errorLogStub: sinon.SinonStub;

    beforeEach(function () {
      // Stub the global fetch function before each test
      // Since fetch is a global function, we need to stub it. Nock will not work on the global fetch function.
      fetchStub = sandbox.stub(global, 'fetch');
      // suppress debug logs
      errorLogStub = sandbox.stub(LOG, 'error');
    });

    afterEach(function () {
      // Restore the original fetch function after each test
      sandbox.restore();
    });

    it('should successfully proxy a text/event-stream response', async () => {
      const mockResponse = new Response('data: {"message":"Hello"}\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });

      fetchStub.resolves(mockResponse);

      return chai
        .request(app)
        .post(`${AIAssistantRoutes.PATHS.BACKEND_PROXY}/new_chat/chat/chat-123-xyz/user-message`)
        .set('Authorization', 'Bearer test-token')
        .send({
          /* Your request body here */
        })
        .then((res) => {
          expect(fetchStub).to.have.been.calledOnce;
          expect(res).to.have.status(200);
          expect(res.text).to.equal('data: {"message":"Hello"}\n\n');
          expect(fetchStub.getCalls()[0].args.length).to.equal(2);
          expect(fetchStub.getCalls()[0].args[0]).to.equal(
            'http://eu.example.com/user-message'
          );
          expect(fetchStub.getCalls()[0].args[1].body).to.equal('{}');
          expect(fetchStub.getCalls()[0].args[1].method).to.equal('POST');
          expect(fetchStub.getCalls()[0].args[1].headers['authorization']).to.equal('Bearer test-token');
          expect(errorLogStub.notCalled).to.be.true;
        });
    });

    it('should throw error when no body response', async () => {
      const mockResponse = new Response(null, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });

      fetchStub.resolves(mockResponse);

      return chai
        .request(app)
        .post(`${AIAssistantRoutes.PATHS.BACKEND_PROXY}/user-message`)
        .set('Authorization', 'Bearer test-token')
        .send({
          /* Your request body here */
        })
        .then((res) => {
          expect(res).to.have.status(500);
          expect(res.body).to.deep.equal({ error: 'Error proxying SSE.' });
          expect(fetchStub.getCalls()[0].args.length).to.equal(2);
          expect(fetchStub.getCalls()[0].args[0]).to.equal(
            'http://eu.example.com/user-message'
          );
          expect(fetchStub.getCalls()[0].args[1].body).to.equal('{}');
          expect(fetchStub.getCalls()[0].args[1].method).to.equal('POST');
          expect(fetchStub.getCalls()[0].args[1].headers['authorization']).to.equal('Bearer test-token');
          expect(errorLogStub.getCalls()[0].args.length).to.equal(2);
          expect(errorLogStub.getCalls()[0].args[0]).to.equal('Error proxying SSE:');
          expect(errorLogStub.getCalls()[0].args[1].message).to.equal('Response body is null.');
        });
    });

    it('should handle error when the target service is down', async () => {
      const mockResponse = new Response('', {
        status: 500,
        headers: { 'Content-Type': 'text/event-stream' },
      });

      fetchStub.resolves(mockResponse);

      return chai
        .request(app)
        .post(`${AIAssistantRoutes.PATHS.BACKEND_PROXY}/new_chat/chat/chat-bad-500/user-message`)
        .set('Authorization', 'Bearer test-token')
        .send({
          /* Your request body here */
        })
        .then((res) => {
          expect(res).to.have.status(500);
          expect(res.body).to.deep.equal({ error: 'Error proxying SSE.' });
          expect(fetchStub.getCalls()[0].args.length).to.equal(2);
          expect(fetchStub.getCalls()[0].args[0]).to.equal(
            'http://eu.example.com/new_chat/chat/chat-bad-500/user-message'
          );
          expect(fetchStub.getCalls()[0].args[1].body).to.equal('{}');
          expect(fetchStub.getCalls()[0].args[1].method).to.equal('POST');
          expect(fetchStub.getCalls()[0].args[1].headers['authorization']).to.equal('Bearer test-token');
          expect(errorLogStub.getCalls()[0].args.length).to.equal(2);
          expect(errorLogStub.getCalls()[0].args[0]).to.equal('Error proxying SSE:');
        });
    });
  });
});
