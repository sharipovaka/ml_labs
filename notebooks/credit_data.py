"""Файл курса для ДЗ 5: генератор заявок на кредит. Заявки зависят от seed варианта (по фамилии)."""
import numpy as np
import pandas as pd


def make_applications(n=800, seed=0):
    # выдуманные заявки: признаки случайные, невозврат зависит от них с долей случайности
    rng = np.random.default_rng([55, seed])
    age = rng.integers(21, 66, n)                                              # возраст
    income = np.round(np.exp(rng.normal(np.log(70), 0.45, n)).clip(20, 400))  # доход, тыс. руб. в месяц
    experience = np.round(np.minimum(age - 20, rng.gamma(1.5, 2.5, n)), 1)    # стаж на текущей работе, лет
    amount = np.round(income * rng.gamma(3.0, 2.5, n).clip(1, 25), -1)        # сумма кредита, тыс. руб.
    payment = np.round(100 * amount * 1.25 / 36 / income).astype(int)         # платёж в % от дохода (36 мес.)
    n_loans = rng.poisson(1.2, n).clip(0, 6)                                   # других текущих кредитов
    past_delays = rng.poisson(0.6, n).clip(0, 8)                               # просрочек по прошлым кредитам
    collateral = (rng.random(n) < 0.3).astype(int)                             # есть залог
    dependents = rng.poisson(0.8, n).clip(0, 4)                                # иждивенцев
    zodiac = rng.integers(1, 13, n)                                            # знак зодиака (не влияет)
    # как банк устроен на самом деле (модель этого не знает); знак зодиака — не влияет
    z = (0.05 * (payment - 30) + 0.35 * (n_loans - 1.2) - 0.006 * (income - 70) - 0.08 * (experience - 3)
         - 0.9 * (collateral - 0.3) + 0.2 * (dependents - 0.8) - 0.02 * (age - 43))
    logit = 2.5 * (past_delays >= 2) + 2.6 * z - 1.3
    default = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)          # 1 — не вернул
    delays_now = np.where(default == 1, rng.poisson(2.5, n) + 1, rng.poisson(0.1, n))  # просрочки по ЭТОМУ кредиту
    app_id = rng.choice(np.arange(100000, 1000000), n, replace=False)          # номер заявки
    return pd.DataFrame({"app_id": app_id, "age": age, "income": income, "experience": experience,
                         "amount": amount, "payment": payment, "n_loans": n_loans, "past_delays": past_delays,
                         "collateral": collateral, "dependents": dependents, "zodiac": zodiac,
                         "delays_now": delays_now, "default": default})


if __name__ == "__main__":
    d = make_applications(800, 1)
    print(d.describe().round(2).T.to_string())
    print("default share by seed:", [round(make_applications(800, s)["default"].mean(), 3) for s in range(8)])
