import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { missionUrl, parseAppRoute, searchWithoutMission, splitAppUrl } from './appRoute';
import { parseCameraRoute } from './cameraRoute';

describe('parseAppRoute', () => {
    it('reads the map and the mission', () => {
        assert.deepEqual(parseAppRoute('?map=1&mpp=4&@52.4,13.06,10000a,0h,0t'), { map: true, mission: undefined });
        assert.deepEqual(parseAppRoute('?mission=abc&@52.4,13.06,500a,90h,90t'), { map: false, mission: 'abc' });
        assert.deepEqual(parseAppRoute(''), { map: false, mission: undefined });
    });

    it('treats an empty mission as none', () => {
        assert.equal(parseAppRoute('?mission=').mission, undefined);
    });

    it('reads a router URL the way location would', () => {
        // The router writes a bare key as `key=`; the camera route still reads.
        const { search, hash } = splitAppUrl('/index.html?@27.89,-15.40,260a,21h,87t=&map=1#x');
        assert.equal(search, '?@27.89,-15.40,260a,21h,87t=&map=1');
        assert.equal(hash, '#x');
        assert.deepEqual(parseAppRoute(search), { map: true, mission: undefined });
        assert.equal(parseCameraRoute(search, hash)?.altM, 260);
    });

    it('round-trips a mission id through its URL', () => {
        const id = 'Rhein run #2';
        assert.equal(parseAppRoute(missionUrl(id).slice('index.html'.length)).mission, id);
    });
});

describe('searchWithoutMission', () => {
    it('drops the mission and keeps the rest untouched', () => {
        assert.equal(searchWithoutMission('?mission=new-mission'), '');
        assert.equal(searchWithoutMission('?@35.95,-112.17,2052a,7h,90t=&mission=abc'), '?@35.95,-112.17,2052a,7h,90t=');
        assert.equal(searchWithoutMission('?map=1'), '?map=1');
        assert.equal(searchWithoutMission(''), '');
    });
});
