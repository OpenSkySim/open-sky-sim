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
