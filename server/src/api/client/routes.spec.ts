import express from 'express';
import sinon from 'sinon';
import bodyParser from 'body-parser';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { LOG } from 'react';

import { ClientRoutes } from './routes';

chai.use(chaiHttp);
const expect = chai.expect;

describe('ClientRoutes', () => {
  let app: express.Express;
  let sandbox: sinon.SinonSandbox;
  let originalEnv: NodeJS.ProcessEnv;
  const mockBackendUrl = 'http://example.com';

  let sendFileSpy: sinon.SinonSpy;

  before(() => (sandbox = sinon.createSandbox()));

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      BACKEND_SERVICE_URL_REGIONS: JSON.stringify({ us: mockBackendUrl }),
    };

    app = express();
    app.use(bodyParser.json());
    app.use((req, res, next) => {
      sendFileSpy = sandbox.stub(res, 'sendFile').callsFake(() => {
        res.send();
      });
      next();
    });

    app.use(ClientRoutes.routes());

    // suppress debug logs
    sandbox.stub(LOG, 'debug');
  });

  afterEach(() => {
    process.env = originalEnv;
    sandbox.restore();
  });

  describe(`GET ${ClientRoutes.PATHS.CATCH_ALL}`, () => {
    it('should return index page', () => {
      return chai
        .request(app)
        .get('/something')
        .send()
        .then((res) => {
          expect(res).to.have.status(200);

          expect(sendFileSpy.callCount).to.equal(1);
          expect(sendFileSpy.getCall(0).args[0]).to.contain('\\client\\dist\\index.html');
        });
    });
  });
});
