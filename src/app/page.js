"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.scss";

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
    },
  };

  const getMinDate = () => new Date().toISOString().split("T")[0];
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 5);
    return maxDate.toISOString().split("T")[0];
  };

  const fetchAvailableTimes = async (selectedDate, selectedMaster) => {
    if (!selectedDate) return;
    setLoadingTimes(true);
    try {
      const res = await fetch(
        `${API_URL}/api/bookings/available-times?date=${selectedDate}&master=${selectedMaster}`
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

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setTime("");
    fetchAvailableTimes(newDate, master);
  };

  const handleMasterChange = (newMaster) => {
    setMaster(newMaster);
    setTime("");
    if (date) fetchAvailableTimes(date, newMaster);
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

    const newBooking = {
      clientName,
      service,
      master,
      date,
      time,
      phone,
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
          <label>{texts[lang].clientName} *</label>
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
          <select value={service} onChange={(e) => setService(e.target.value)}>
            <option value="haircut">Մազերի կտրվածք</option>
            <option value="hairBeard">Մազ + մորուք</option>
            <option value="beard">Մորուք</option>
          </select>
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
          <label>{texts[lang].date} *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            required
          />
        </div>

        <div className={styles.field}>
          <label>{texts[lang].time} *</label>
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
          <label>{texts[lang].phone} *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+374 XX XXX XXX"
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
    </div>
  );
}
