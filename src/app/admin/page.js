"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.scss";

export default function AdminPanel() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lang, setLang] = useState("ru");

  const texts = {
    ru: {
      title: "Панель администратора",
      all: "Все",
      pending: "Ожидают",
      confirmed: "Подтверждены",
      completed: "Завершены",
      cancelled: "Отменены",
      clientName: "Имя клиента",
      service: "Услуга",
      master: "Мастер",
      date: "Дата",
      time: "Время",
      phone: "Телефон",
      status: "Статус",
      actions: "Действия",
      confirm: "Подтвердить",
      complete: "Завершить",
      cancel: "Отменить",
      delete: "Удалить",
      loading: "Загрузка...",
      noBookings: "Нет бронирований",
      error: "Ошибка загрузки данных"
    },
    hy: {
      title: "Ադմինիստրատորի վահանակ",
      all: "Բոլորը",
      pending: "Սպասում են",
      confirmed: "Հաստատված",
      completed: "Ավարտված",
      cancelled: "Չեղարկված",
      clientName: "Հաճախորդի անուն",
      service: "Ծառայություն",
      master: "Վարպետ",
      date: "Ամսաթիվ",
      time: "Ժամ",
      phone: "Հեռախոս",
      status: "Կարգավիճակ",
      actions: "Գործողություններ",
      confirm: "Հաստատել",
      complete: "Ավարտել",
      cancel: "Չեղարկել",
      delete: "Ջնջել",
      loading: "Բեռնվում է...",
      noBookings: "Ամրագրումներ չկան",
      error: "Տվյալների բեռնման սխալ"
    }
  };

  const serviceNames = {
    haircut: "Մազերի կտրվածք",
    hairBeard: "Մազեր + մորուք", 
    beard: "Մորուք"
  };

  const masterNames = {
    gegham: "Գեղամ"
  };

  const statusColors = {
    pending: "#ffa500",
    confirmed: "#32cd32",
    completed: "#4169e1",
    cancelled: "#dc143c"
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error("Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setBookings(bookings.map(booking => 
          booking._id === id ? { ...booking, status: newStatus } : booking
        ));
      } else {
        alert("Ошибка обновления статуса");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Ошибка соединения с сервером");
    }
  };

  const deleteBooking = async (id) => {
    if (!confirm("Вы уверены, что хотите удалить это бронирование?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setBookings(bookings.filter(booking => booking._id !== id));
      } else {
        alert("Ошибка удаления бронирования");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Ошибка соединения с сервером");
    }
  };

  const filteredBookings = filter === "all" 
    ? bookings 
    : bookings.filter(booking => booking.status === filter);

  if (loading) {
    return (
      <div className={styles.adminPanel}>
        <div className={styles.loading}>{texts[lang].loading}</div>
      </div>
    );
  }

  return (
    <div className={styles.adminPanel}>
      <header className={styles.header}>
        <h1>{texts[lang].title}</h1>
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
      </header>

      <div className={styles.filters}>
        {["all", "pending", "confirmed", "completed", "cancelled"].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={filter === status ? styles.activeFilter : ""}
          >
            {texts[lang][status]}
          </button>
        ))}
      </div>

      <div className={styles.bookingsList}>
        {filteredBookings.length === 0 ? (
          <div className={styles.noBookings}>{texts[lang].noBookings}</div>
        ) : (
          <table className={styles.bookingsTable}>
            <thead>
              <tr>
                <th>{texts[lang].clientName}</th>
                <th>{texts[lang].service}</th>
                <th>{texts[lang].master}</th>
                <th>{texts[lang].date}</th>
                <th>{texts[lang].time}</th>
                <th>{texts[lang].phone}</th>
                <th>{texts[lang].status}</th>
                <th>{texts[lang].actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.clientName}</td>
                  <td>{serviceNames[booking.service]}</td>
                  <td>{masterNames[booking.master]}</td>
                  <td>{booking.date}</td>
                  <td>{booking.time}</td>
                  <td>{booking.phone}</td>
                  <td>
                    <span 
                      className={styles.status}
                      style={{ backgroundColor: statusColors[booking.status] }}
                    >
                      {texts[lang][booking.status]}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    {booking.status === "pending" && (
                      <button
                        onClick={() => updateBookingStatus(booking._id, "confirmed")}
                        className={styles.confirmBtn}
                      >
                        {texts[lang].confirm}
                      </button>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => updateBookingStatus(booking._id, "completed")}
                        className={styles.completeBtn}
                      >
                        {texts[lang].complete}
                      </button>
                    )}
                    {(booking.status === "pending" || booking.status === "confirmed") && (
                      <button
                        onClick={() => updateBookingStatus(booking._id, "cancelled")}
                        className={styles.cancelBtn}
                      >
                        {texts[lang].cancel}
                      </button>
                    )}
                    <button
                      onClick={() => deleteBooking(booking._id)}
                      className={styles.deleteBtn}
                    >
                      {texts[lang].delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
