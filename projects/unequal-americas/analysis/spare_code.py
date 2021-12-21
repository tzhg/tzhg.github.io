

while False:
    b_init = (mu ** 2 * (mu - m) - (3 * m - mu) * sd ** 2) / (sd ** 2 - mu ** 2 + mu * m)
    p_init = mu / b_init * (2 * m + b_init) / (mu - m)
    q_init = (mu + m + b_init) / (mu - m)

    if b_init <= 0:
        raise ValueError(f"b must be > 0 (b={b_init})")
    if p_init <= 1:
        raise ValueError(f"p must be > 1 (p={p_init})")
    if q_init <= 1:
        raise ValueError(f"q must be > 1 (q={q_init})")
