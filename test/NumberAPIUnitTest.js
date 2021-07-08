import {NumberAPI} from '../lib/NumberAPI.js'; 
import should from 'should';
describe('check whether the input is a integer', ()=>{
    it('n = 1',done=>{
        NumberAPI.IsInt(1).should.equal(true);
        done();
    })
    it('n = -1',done=>{
        NumberAPI.IsInt(-1).should.equal(true);
        done();
    })
    it('n = 0',done=>{
        NumberAPI.IsInt(0).should.equal(true);
        done();
    })
    it('n = 0.8',done=>{
        NumberAPI.IsInt(0.8).should.equal(false);
        done();
    })
    it('n = -0.8',done=>{
        NumberAPI.IsInt(-0.8).should.equal(false);
        done();
    })
    it('n = 10.0',done=>{
        NumberAPI.IsInt(10.0).should.equal(true);
        done();
    })
});
describe('check whether the input is a float', ()=>{
    it('n = 1',done=>{
        NumberAPI.IsFloat(1).should.equal(false);
        done();
    })
    it('n = -1',done=>{
        NumberAPI.IsFloat(-1).should.equal(false);
        done();
    })
    it('n = 0',done=>{
        NumberAPI.IsFloat(0).should.equal(false);
        done();
    })
    it('n = 0.8',done=>{
        NumberAPI.IsFloat(0.8).should.equal(true);
        done();
    })
    it('n = -0.8',done=>{
        NumberAPI.IsFloat(-0.8).should.equal(true);
        done();
    })
    it('n = 10.0',done=>{
        NumberAPI.IsFloat(10.0).should.equal(false);
        done();
    })
});