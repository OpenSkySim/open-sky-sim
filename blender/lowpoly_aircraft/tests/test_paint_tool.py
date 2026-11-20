import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paint_tool import merge  # noqa: E402

BASE = {'base': '#aaaaaa', 'regions': [
    {'view': 'side', 'color': '#111111', 'pts': [[0, 0], [1, 0], [1, 1]]},
    {'view': 'top', 'color': '#222222', 'pts': [[0, 0], [1, 0], [1, 1]]}]}


def test_edit_remove_add_and_base():
    docs = {'r0': {'color': '#333333', 't': '1'}, 'r1': {'removed': True, 't': '2'},
            'p-x': {'view': 'bottom', 'color': '#444444', 'mirror': False, 'pts': [[0, 0], [2, 0], [2, 2]], 't': '3'},
            'base': {'base': '#bbbbbb'}}
    out = merge(BASE, docs)
    assert out['base'] == '#bbbbbb'
    assert [r['color'] for r in out['regions']] == ['#333333', '#444444']
    assert out['regions'][0]['pts'] == [[0, 0], [1, 0], [1, 1]]
    assert out['regions'][1]['mirror'] is False


def test_no_docs_keeps_base():
    assert len(merge(BASE, {})['regions']) == 2


def test_skins_from_hangar():
    from paint_tool import merge_skins
    cols = {'paint': {'r1': {'removed': True, 't': '1'}, 'base': {'base': '#bbbbbb'}},
            'skins': {'default': {'name': 'Navy', 't': '1'},
                      'sabc': {'name': 'Arctic', 'base': '#eeeeee', 'number': '35', 't': '2'},
                      'sold': {'name': 'Gone', 'removed': True, 't': '3'}},
            'paint_sabc': {'p-1': {'view': 'top', 'color': '#555555', 'pts': [[0, 0], [1, 0], [1, 1]], 't': '4'}}}
    out = merge_skins({**BASE, 'about': 'x'}, cols)
    assert out['about'] == 'x'
    assert [s['id'] for s in out['skins']] == ['default', 'sabc']
    d, a = out['skins']
    assert d['name'] == 'Navy' and d['base'] == '#bbbbbb' and len(d['regions']) == 1
    assert a['name'] == 'Arctic' and a['base'] == '#eeeeee' and a['number'] == '35'
    assert [r['color'] for r in a['regions']] == ['#555555']


def test_skins_edit_built_skin_and_old_format_kept():
    from paint_tool import merge_skins
    from lpa import skins
    multi = {'skins': [{'id': 'default', 'name': 'A', 'base': '#111111', 'regions': []},
                       {'id': 'b', 'name': 'B', 'base': '#222222', 'regions': BASE['regions']}]}
    out = merge_skins(multi, {'paint_b': {'r0': {'removed': True}}, 'skins': {'b': {'name': 'B2'}}})
    got = skins.normalize(out)
    assert [s['name'] for s in got] == ['A', 'B2'] and len(got[1]['regions']) == 1
    single = merge_skins(BASE, {'paint': {}})
    assert 'skins' not in single and len(single['regions']) == 2


def test_normalize_old_and_unique_ids():
    from lpa import skins
    assert skins.normalize({'base': '#123456', 'regions': []}) == [
        {'id': 'default', 'base': '#123456', 'regions': [], 'name': 'Default'}]
    got = skins.normalize({'material': 'M', 'skins': [{'name': 'Navy'}, {'name': 'Desert Sand'}, {'name': 'Desert Sand'}]})
    assert [s['id'] for s in got] == ['default', 'desert-sand', 'desert-sand-2']
    assert all(s['material'] == 'M' for s in got)
    assert skins.text_override({'number': '07', 'number_color': '#fff'}) == {'text': '07', 'color': '#fff'}
