"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.scss";
import RequiredLabel from "./RequiredLabel";

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [lang, setLang] = useState("hy");
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState("haircut");
  const [master, setMaster] = useState("gegham");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [chatId, setChatId] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // Telegram Web App init
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); // обязательно

      // Проверяем, есть ли данные пользователя
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setChatId(user.id);
        setUsername(user.first_name || "");
        if (!clientName) setClientName(user.first_name || "");
      }
    }
  }, []);

  const texts = {
    ru: {
      clientName: "Имя клиента",
      service: "Выберите услугу",
      master: "Выберите мастера",
      date: "Дата",
      time: "Время",
      phone: "Телефон",
      book: "Забронировать",
      booking: "Бронирование...",
      fillAll: "Заполните все поля!",
      success: "Бронирование успешно!",
      error: "Ошибка бронирования",
      connectionError: "Ошибка соединения с сервером",
      slotTaken: "Это время уже занято",
      nameRequired: "Имя обязательно для заполнения",
      phoneRequired: "Телефон обязателен для заполнения",
      dateRequired: "Дата обязательна для заполнения",
      timeRequired: "Время обязательно для заполнения",
      dateOutOfRange: "Доступны даты: завтра и ещё 5 дней",
    },
    hy: {
      clientName: "Հաճախորդի անուն",
      service: "Ընտրեք ծառայությունը",
      master: "Ընտրեք վարպետին",
      date: "Ամսաթիվ",
      time: "Ժամ",
      phone: "Հեռախոս",
      book: "Ամրագրել",
      booking: "Ամրագրվում է...",
      fillAll: "Լրացրեք բոլոր դաշտերը!",
      success: "Ամրագրումը հաջողվեց!",
      error: "Ամրագրման սխալ",
      connectionError: "Սերվերի հետ կապի սխալ",
      slotTaken: "Այս ժամը արդեն զբաղված է",
      nameRequired: "Անունը պարտադիր է",
      phoneRequired: "Հեռախոսը պարտադիր է",
      dateRequired: "Ամսաթիվը պարտադիր է",
      timeRequired: "Ժամը պարտադիր է",
      dateOutOfRange: "Մատչելի են թեթեւեից հետո + 5 օր",
    },
  };

  const toYYYYMMDDLocal = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // скрываем сегодняшний день
    return toYYYYMMDDLocal(d);
  };
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 5);
    return toYYYYMMDDLocal(maxDate);
  };

  // Детект iOS
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Список доступных дат [завтра..+5]
  const getAllowedDates = () => {
    const dates = [];
    const start = new Date();
    start.setDate(start.getDate() + 1);
    for (let i = 0; i <= 5; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push({
        value: toYYYYMMDDLocal(d),
        label: toYYYYMMDDLocal(d),
      });
    }
    return dates;
  };

  const isDateAllowed = (dateStr) => {
    if (!dateStr) return false;
    const min = getMinDate();
    const max = getMaxDate();
    return dateStr >= min && dateStr <= max;
  };

  const fetchAvailableTimes = async (selectedDate, selectedMaster, selectedService) => {
    if (!selectedDate) return;
    setLoadingTimes(true);
    try {
      const res = await fetch(
        `${API_URL}/api/bookings/available-times?date=${selectedDate}&master=${selectedMaster}&service=${selectedService}`
      );
      if (res.ok) {
        const times = await res.json();
        setAvailableTimes(times);
        if (time && !times.includes(time)) setTime("");
      } else setAvailableTimes([]);
    } catch {
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  // Маска телефона: всегда префикс +374 и формат +374 (XX) XXX-XXX
  useEffect(() => {
    if (!phone) setPhone("+374 (");
  }, []);

  const formatArPhone = (raw) => {
    const digits = (raw || "").replace(/\D/g, "");
    const rest = digits.startsWith("374") ? digits.slice(3) : digits;
    const limited = rest.slice(0, 8); // 2 + 3 + 3 = 8
    const a = limited.slice(0, 2); // XX
    const b = limited.slice(2, 5); // XXX
    const c = limited.slice(5, 8); // XXX

    let result = "+374 (";
    result += a;
    if (a.length === 2) result += ") ";
    if (b.length) result += b;
    if (c.length) result += `-${c}`;

    return result;
  };

  const handlePhoneChange = (value) => {
    setPhone(formatArPhone(value));
  };

  // Защита от удаления префикса и скобки при фокусе
  const handlePhoneKeyDown = (e) => {
    const value = e.currentTarget.value || "";
    const selectionStart = e.currentTarget.selectionStart ?? 0;
    // Блокируем backspace/delete в зоне префикса '+374 ('
    if ((e.key === "Backspace" && selectionStart <= 6) || (e.key === "Delete" && selectionStart < 6)) {
      e.preventDefault();
    }
  };

  const handleDateChange = (newDate) => {
    if (!isDateAllowed(newDate)) {
      showMessage(texts[lang].dateOutOfRange, "error");
      return;
    }
    setDate(newDate);
    setTime("");
    fetchAvailableTimes(newDate, master, service);
  };

  const handleMasterChange = (newMaster) => {
    setMaster(newMaster);
    setTime("");
    if (date) fetchAvailableTimes(date, newMaster, service);
  };

  const handleServiceChange = (newService) => {
    setService(newService);
    setTime("");
    if (date) fetchAvailableTimes(date, master, newService);
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const validateForm = () => {
    const errors = [];
    if (!clientName.trim()) errors.push(texts[lang].nameRequired);
    if (!phone.trim()) errors.push(texts[lang].phoneRequired);
    if (!date) errors.push(texts[lang].dateRequired);
    if (!time) errors.push(texts[lang].timeRequired);
    return errors;
  };

  const handleBooking = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      showMessage(errors.join(", "), "error");
      return;
    }

    setLoading(true);

    const normalizeArPhone = (raw) => {
      const digits = (raw || "").replace(/\D/g, "");
      const rest = digits.startsWith("374") ? digits.slice(3) : digits;
      const limited = rest.slice(0, 8);
      return `+374${limited}`;
    };

    const newBooking = {
      clientName,
      service,
      master,
      date,
      time,
      phone: normalizeArPhone(phone),
      userChatId: chatId, // telegram user id
      telegramName: username, // telegram first_name
    };

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      });

      if (res.ok) {
        showMessage(texts[lang].success, "success");
        setClientName(username || "");
        setDate("");
        setTime("");
        setPhone("");
      } else {
        const data = await res.json();
        if (res.status === 409) showMessage(texts[lang].slotTaken, "error");
        else if (res.status === 400 && data.details)
          showMessage(data.details.join(", "), "error");
        else showMessage(texts[lang].error, "error");
      }
    } catch {
      showMessage(texts[lang].connectionError, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.langSwitch}>
            <button
              onClick={() => setLang("ru")}
              className={lang === "ru" ? styles.active : ""}
            >
              RU
            </button>
            <button
              onClick={() => setLang("hy")}
              className={lang === "hy" ? styles.active : ""}
            >
              HY
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      <main className={styles.content}>
        <div className={styles.field}>
          <label><RequiredLabel>{texts[lang].clientName}</RequiredLabel></label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder={
              lang === "ru" ? "Введите ваше имя" : "Մուտքագրեք ձեր անունը"
            }
            required
          />
        </div>

        <div className={styles.field}>
          <label>{texts[lang].service}</label>
          {isIOS ? (
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  name="service"
                  value="haircut"
                  checked={service === "haircut"}
                  onChange={(e) => handleServiceChange(e.target.value)}
                />
                Մազերի կտրվածք
              </label>
              <label>
                <input
                  type="radio"
                  name="service"
                  value="hairBeard"
                  checked={service === "hairBeard"}
                  onChange={(e) => handleServiceChange(e.target.value)}
                />
                Մազ + մորուք
              </label>
              <label>
                <input
                  type="radio"
                  name="service"
                  value="beard"
                  checked={service === "beard"}
                  onChange={(e) => handleServiceChange(e.target.value)}
                />
                Մորուք
              </label>
            </div>
          ) : (
            <select value={service} onChange={(e) => handleServiceChange(e.target.value)}>
              <option value="haircut">Մազերի կտրվածք</option>
              <option value="hairBeard">Մազ + մորուք</option>
              <option value="beard">Մորուք</option>
            </select>
          )}
        </div>

        <div className={styles.field}>
          <label>{texts[lang].master}</label>
          <select
            value={master}
            onChange={(e) => handleMasterChange(e.target.value)}
          >
            <option value="gegham">Գեղամ</option>
          </select>
        </div>

        <div className={styles.field}>
          <label><RequiredLabel>{texts[lang].date}</RequiredLabel></label>
          {isIOS ? (
            <select
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            >
              <option value="">{lang === "ru" ? "Выберите дату" : "Ընտրեք ամսաթիվը"}</option>
              {getAllowedDates().map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              inputMode="none"
              onKeyDown={(e) => e.preventDefault()}
              required
            />
          )}
        </div>

        <div className={styles.field}>
          <label><RequiredLabel>{texts[lang].time}</RequiredLabel></label>
          {loadingTimes ? (
            <div className={styles.loadingTimes}>
              {lang === "ru"
                ? "Загрузка доступных времен..."
                : "Բեռնվում են հասանելի ժամերը..."}
            </div>
          ) : (
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={!date || availableTimes.length === 0}
            >
              <option value="">
                {!date
                  ? lang === "ru"
                    ? "Сначала выберите дату"
                    : "Նախ ընտրեք ամսաթիվը"
                  : availableTimes.length === 0
                    ? lang === "ru"
                      ? "Нет доступных времен"
                      : "Հասանելի ժամեր չկան"
                    : lang === "ru"
                      ? "Выберите время"
                      : "Ընտրեք ժամը"}
              </option>
              {availableTimes.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.field}>
          <label><RequiredLabel>{texts[lang].phone}</RequiredLabel></label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={(e) => setPhone(formatArPhone(e.target.value))}
            onKeyDown={handlePhoneKeyDown}
            placeholder="+374 (XX) XXX-XXX"
            inputMode="numeric"
            required
          />
        </div>

        <button
          className={styles.bookBtn}
          onClick={handleBooking}
          disabled={loading}
        >
          {loading ? texts[lang].booking : texts[lang].book}
        </button>
      </main>
      <footer style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", color: "rgb(163 161 161)" }}>
        Bot-ի հեղինակ{" "}
        <a
          href="https://t.me/theslavprod"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "red", textDecoration: "none", fontWeight: "bold" }}
        >
          @theslavprod
        </a>
      </footer>
    </div>
  );
}
