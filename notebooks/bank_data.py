"""Файл курса для ДЗ 6: переводы, отложенные антифродом, и обращения в поддержку банка. Зависят от seed варианта (по фамилии)."""
import numpy as np
import pandas as pd


def make_transfers(n=800, seed=0):
    # выдуманные переводы, которые антифрод отложил, а служба безопасности проверила вручную
    rng = np.random.default_rng([61, seed])
    amount = np.round(np.exp(rng.normal(np.log(6000), 1.1, n)).clip(100, 500000), -1)  # сумма, руб.
    hour = rng.integers(0, 24, n)                                   # час перевода (0–23)
    new_recipient = (rng.random(n) < 0.4).astype(int)               # получатель новый, раньше ему не переводили
    per_hour = rng.poisson(1.0, n).clip(0, 8)                       # других переводов за последний час
    recipient_days = np.round(np.exp(rng.uniform(np.log(2), np.log(4000), n))).astype(int)  # счёт получателя открыт, дней назад
    weekday = rng.integers(1, 8, n)                                 # день недели (не влияет)
    # как устроено на самом деле (модель этого не знает); день недели — не влияет
    night = ((hour <= 5) | (hour >= 23)).astype(int)
    logit = (4.0 * new_recipient + 3.5 * night + 1.4 * (per_hour - 1) + 1.8 * (np.log10(amount) - 3.8)
             - 2.5 * (np.log10(recipient_days) - 2) - 4.5)
    fraud = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)  # 1 — мошенничество
    return pd.DataFrame({"amount": amount, "hour": hour, "new_recipient": new_recipient, "per_hour": per_hour,
                         "recipient_days": recipient_days, "weekday": weekday, "fraud": fraud})


DEPTS = {
    "карты": ["карта заблокирована", "не проходит оплата картой", "потерял карту", "банкомат не вернул карту",
              "хочу перевыпустить карту", "списали деньги с карты дважды", "не приходит кэшбэк", "забыл пин код"],
    "кредиты": ["хочу досрочно погасить кредит", "не списался платёж по кредиту", "какая ставка по ипотеке",
                "нужна справка об остатке долга", "прошу кредитные каникулы", "неверно начислены проценты по кредиту",
                "одобрят ли рефинансирование", "просрочка по кредиту не моя"],
    "вклады": ["хочу открыть вклад", "когда начислят проценты по вкладу", "можно ли пополнить вклад",
               "закрыть вклад досрочно", "какая ставка по накопительному счёту", "не пришли проценты на счёт",
               "продлить депозит", "застрахован ли вклад"],
    "приложение": ["приложение не открывается", "не приходит код из смс", "не могу войти в приложение",
                   "вылетает после обновления", "не вижу историю операций", "забыл пароль от приложения",
                   "не работает вход по отпечатку", "приложение пишет ошибку"],
}
COMMON = ["здравствуйте", "помогите пожалуйста", "срочно", "это уже второй раз", "жду ответа", "спасибо",
          "не могу разобраться", "деньги нужны сегодня"]


def make_requests(n=600, seed=0):
    # выдуманные обращения в поддержку: фразы своего отдела, общие слова и иногда фраза из чужого отдела
    rng = np.random.default_rng([62, seed])
    names = list(DEPTS)
    dept = rng.choice(names, n, p=[0.3, 0.25, 0.2, 0.25])
    texts = []
    for d in dept:
        parts = list(rng.choice(DEPTS[d], rng.integers(1, 3), replace=False))
        if rng.random() < 0.35:                                     # клиент заодно пишет про другое
            parts.append(rng.choice(DEPTS[rng.choice([x for x in names if x != d])]))
        if rng.random() < 0.7:
            parts.insert(0, rng.choice(COMMON))
        texts.append(". ".join(p[0].upper() + p[1:] for p in parts))
    return pd.DataFrame({"text": texts, "dept": dept})


if __name__ == "__main__":
    import sys
    from sklearn.feature_extraction.text import CountVectorizer
    from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    cv5 = StratifiedKFold(5, shuffle=True, random_state=0)
    F = ["amount", "hour", "new_recipient", "per_hour", "recipient_days", "weekday"]
    for s in map(int, sys.argv[1:] or range(1, 11)):
        t = make_transfers(800, s)
        tr, te = train_test_split(t, test_size=0.25, random_state=s, stratify=t.fraud)
        X, y = tr[F], tr.fraud
        raw = cross_val_score(KNeighborsClassifier(5), X, y, cv=cv5).mean()
        sc = cross_val_score(make_pipeline(StandardScaler(), KNeighborsClassifier(5)), X, y, cv=cv5).mean()
        ks = [1, 3, 5, 7, 11, 15, 21, 31, 51]
        cvk = [cross_val_score(make_pipeline(StandardScaler(), KNeighborsClassifier(k)), X, y, cv=cv5).mean() for k in ks]
        r = make_requests(600, s)
        rtr, rte = train_test_split(r, test_size=0.25, random_state=s, stratify=r.dept)
        nbp = make_pipeline(CountVectorizer(), MultinomialNB())
        cvn = cross_val_score(nbp, rtr.text, rtr.dept, cv=cv5).mean()
        print(f"seed {s:2d} fraud {t.fraud.mean():.3f} base {1 - y.mean():.3f} raw {raw:.3f} sc {sc:.3f} "
              f"best k {ks[int(np.argmax(cvk))]} {max(cvk):.3f} k1 {cvk[0]:.3f} | nb cv {cvn:.3f} test {nbp.fit(rtr.text, rtr.dept).score(rte.text, rte.dept):.3f}")
