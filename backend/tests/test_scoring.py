from app.game.scoring import DEFAULT_SCORING, competition_rank, count_chars, points_for_rank, round_ranking


def test_ties_share_rank_and_skip():
    ranked = competition_rank([("a", 27), ("b", 27), ("c", 29), ("d", 31)])
    assert [(k, r) for k, _, r in ranked] == [("a", 1), ("b", 1), ("c", 3), ("d", 4)]


def test_round_ties_go_to_the_earlier_submission():
    # (player, chars, submitted_at): B and C tie on length, C got there first.
    ranked = round_ranking([("A", 24, 50), ("B", 27, 90), ("C", 27, 30), ("D", 29, 10)])
    assert [(k, r) for k, _, r in ranked] == [("A", 1), ("C", 2), ("B", 3), ("D", 4)]


def test_points_by_rank():
    assert [points_for_rank(r, DEFAULT_SCORING) for r in range(1, 11)] == [10, 8, 6, 5, 4, 3, 2, 1, 1, 1]
    assert points_for_rank(1, []) == 0


def test_every_character_counts():
    assert count_chars("s=input();print(s==s[::-1])") == 27
    assert count_chars("a = 1\nprint(a)\n") == 15
    assert count_chars("a\r\nb") == 3  # CRLF normalised
    assert count_chars("print('é')") == 10  # code points, not bytes
