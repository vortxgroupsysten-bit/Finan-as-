import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// CONFIGURAÇÃO DO FIREBASE
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyBR9En-VvtdBMXmf3RV5GfEW8dAK990XLA",
  authDomain: "financas-3ca07.firebaseapp.com",
  projectId: "financas-3ca07",
  storageBucket: "financas-3ca07.firebasestorage.app",
  messagingSenderId: "1049971527541",
  appId: "1:1049971527541:web:0e4f8c4d6ef879c7a04d3c",
  measurementId: "G-XB06NHKWFX"
};


// ===============================
// FIREBASE / FIRESTORE
// ===============================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ROOT = "usuarios/usuario-pessoal";

const daysRef = collection(
  db,
  `${ROOT}/dias`
);

const expensesRef = collection(
  db,
  `${ROOT}/despesas`
);


// ===============================
// ELEMENTOS DO HTML
// ===============================

const monthPicker = document.getElementById("monthPicker");
const daysBody = document.getElementById("daysBody");

const totalMeta = document.getElementById("totalMeta");
const totalFeito = document.getElementById("totalFeito");
const totalDespesas = document.getElementById("totalDespesas");
const saldo = document.getElementById("saldo");

const selectedDayLabel =
  document.getElementById("selectedDayLabel");

const expenseForm =
  document.getElementById("expenseForm");

const expensesList =
  document.getElementById("expensesList");

const expenseDescription =
  document.getElementById("expenseDescription");

const expenseValue =
  document.getElementById("expenseValue");

const toast =
  document.getElementById("toast");


// ===============================
// VARIÁVEIS
// ===============================

let days = {};
let expenses = {};
let selectedDay = null;


// ===============================
// FORMATAÇÃO DE MOEDA
// ===============================

const brl = value =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });


// ===============================
// MÊS ATUAL
// ===============================

const today = new Date();

monthPicker.value =
  `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;


// ===============================
// AVISO / TOAST
// ===============================

function showToast(text) {

  toast.textContent = text;

  toast.classList.add("show");

  clearTimeout(showToast.t);

  showToast.t = setTimeout(
    () => toast.classList.remove("show"),
    1800
  );
}


// ===============================
// QUANTIDADE DE DIAS DO MÊS
// ===============================

function daysInMonth(month) {

  const [year, mon] =
    month.split("-").map(Number);

  return new Date(
    year,
    mon,
    0
  ).getDate();
}


// ===============================
// DESPESAS DE UM DIA
// ===============================

function expensesFor(dayId) {

  return Object.values(expenses)
    .filter(
      e =>
        e.month === monthPicker.value &&
        e.dayId === dayId
    );
}


// ===============================
// TOTAL DE DESPESAS DO DIA
// ===============================

function expenseTotal(dayId) {

  return expensesFor(dayId)
    .reduce(
      (sum, e) =>
        sum + Number(e.value || 0),
      0
    );
}


// ===============================
// NOME DO DIA DA SEMANA
// ===============================

function getWeekday(month, day) {

  const [year, monthNumber] =
    month.split("-").map(Number);

  /*
    IMPORTANTE:

    No JavaScript:
    Janeiro = 0
    Fevereiro = 1
    Março = 2
    ...

    Por isso usamos:
    monthNumber - 1

    O horário 12:00 evita problemas
    de mudança de horário/fuso.
  */

  const date = new Date(
    year,
    monthNumber - 1,
    day,
    12,
    0,
    0
  );

  return date.toLocaleDateString(
    "pt-BR",
    {
      weekday: "short"
    }
  );
}


// ===============================
// RENDERIZAR TABELA
// ===============================

function render() {

  const month = monthPicker.value;

  const count = daysInMonth(month);

  const rows = [];

  let metaSum = 0;
  let feitoSum = 0;
  let expenseSum = 0;


  // ===============================
  // CRIAR CADA DIA
  // ===============================

  for (
    let d = 1;
    d <= count;
    d++
  ) {

    const id =
      `${month}-${String(d).padStart(2, "0")}`;


    const item =
      days[id] || {
        id,
        month,
        day: d,
        meta: 0,
        feito: 0
      };


    const desp =
      expenseTotal(id);


    const resultado =
      Number(item.feito || 0) -
      Number(item.meta || 0);


    metaSum +=
      Number(item.meta || 0);

    feitoSum +=
      Number(item.feito || 0);

    expenseSum += desp;


    // ===============================
    // STATUS DA META
    // ===============================

    let status = "Sem dados";
    let cls = "status-neutral";


    if (
      Number(item.meta || 0) > 0
    ) {

      if (
        Number(item.feito || 0) >=
        Number(item.meta || 0)
      ) {

        status = "Meta batida";
        cls = "status-ok";

      } else {

        status =
          `Falta ${brl(
            Number(item.meta) -
            Number(item.feito)
          )}`;

        cls = "status-bad";
      }
    }


    // ===============================
    // DIA DA SEMANA
    // ===============================

    const weekday =
      getWeekday(month, d);


    // ===============================
    // LINHA
    // ===============================

    rows.push(`
      <tr>

        <td class="day">
          ${String(d).padStart(2, "0")}

          <small>
            ${weekday}
          </small>
        </td>


        <td>
          <input
            class="money-input"
            type="number"
            min="0"
            step="0.01"
            value="${Number(item.meta || 0)}"
            data-field="meta"
            data-id="${id}"
          >
        </td>


        <td>
          <input
            class="money-input"
            type="number"
            min="0"
            step="0.01"
            value="${Number(item.feito || 0)}"
            data-field="feito"
            data-id="${id}"
          >
        </td>


        <td>
          <strong>
            ${brl(desp)}
          </strong>
        </td>


        <td class="${
          resultado >= 0
            ? "result-positive"
            : "result-negative"
        }">

          ${brl(resultado)}

        </td>


        <td>
          <span class="status ${cls}">
            ${status}
          </span>
        </td>


        <td class="actions">

          <button
            class="edit"
            data-action="expenses"
            data-id="${id}"
          >
            Despesas
          </button>


          <button
            class="delete"
            data-action="delete"
            data-id="${id}"
          >
            Excluir
          </button>

        </td>

      </tr>
    `);
  }


  // ===============================
  // ATUALIZAR HTML
  // ===============================

  daysBody.innerHTML =
    rows.join("");


  // ===============================
  // TOTAIS
  // ===============================

  totalMeta.textContent =
    brl(metaSum);

  totalFeito.textContent =
    brl(feitoSum);

  totalDespesas.textContent =
    brl(expenseSum);

  saldo.textContent =
    brl(feitoSum - expenseSum);


  renderExpenses();
}


// ===============================
// SALVAR DIA
// ===============================

async function saveDay(
  id,
  field,
  value
) {

  const existing =
    days[id] || {

      id,

      month:
        monthPicker.value,

      day:
        Number(id.slice(-2)),

      meta: 0,

      feito: 0
    };


  existing[field] =
    Number(value || 0);


  days[id] =
    existing;


  await setDoc(
    doc(
      db,
      daysRef.path,
      id
    ),
    existing
  );


  render();
}


// ===============================
// CRIAR TODOS OS DIAS
// ===============================

async function createAllDays() {

  const month =
    monthPicker.value;

  const count =
    daysInMonth(month);


  for (
    let d = 1;
    d <= count;
    d++
  ) {

    const id =
      `${month}-${String(d).padStart(2, "0")}`;


    if (!days[id]) {

      const item = {

        id,

        month,

        day: d,

        meta: 0,

        feito: 0

      };


      await setDoc(
        doc(
          db,
          daysRef.path,
          id
        ),
        item
      );
    }
  }


  showToast(
    "Dias do mês criados."
  );
}


// ===============================
// EXCLUIR DIA
// ===============================

async function deleteDay(id) {

  if (
    !confirm(
      "Excluir os dados deste dia? As despesas desse dia também serão excluídas."
    )
  ) {

    return;
  }


  await deleteDoc(
    doc(
      db,
      daysRef.path,
      id
    )
  );


  for (
    const e of expensesFor(id)
  ) {

    await deleteDoc(
      doc(
        db,
        expensesRef.path,
        e.id
      )
    );
  }


  showToast(
    "Dia excluído."
  );
}


// ===============================
// DESPESAS
// ===============================

function renderExpenses() {

  if (!selectedDay) {

    selectedDayLabel.textContent =
      "Selecione um dia";

    expenseForm.classList.add(
      "hidden"
    );

    expensesList.innerHTML = `
      <p class="empty">
        Selecione "Despesas" em um dia
        para ver os lançamentos.
      </p>
    `;

    return;
  }


  expenseForm.classList.remove(
    "hidden"
  );


  selectedDayLabel.textContent =
    `Dia ${selectedDay.slice(-2)} — ${monthPicker.value}`;


  const list =
    expensesFor(selectedDay);


  if (!list.length) {

    expensesList.innerHTML = `
      <p class="empty">
        Nenhuma despesa lançada neste dia.
      </p>
    `;

    return;
  }


  expensesList.innerHTML =
    list.map(e => `

      <div class="expense-item">

        <span>
          ${escapeHtml(
            e.description
          )}
        </span>


        <div>

          <strong>
            ${brl(e.value)}
          </strong>


          <button
            class="delete"
            data-expense-delete="${e.id}"
          >
            Excluir
          </button>

        </div>

      </div>

    `).join("");
}


// ===============================
// PROTEÇÃO HTML
// ===============================

function escapeHtml(text) {

  return String(text)
    .replace(
      /[&<>"']/g,
      m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m])
    );
}


// ===============================
// ALTERAÇÃO DOS CAMPOS
// ===============================

daysBody.addEventListener(
  "change",
  async e => {

    const input =
      e.target.closest(
        "input[data-field]"
      );


    if (!input) return;


    try {

      await saveDay(
        input.dataset.id,
        input.dataset.field,
        input.value
      );


      showToast(
        "Salvo no Firestore."
      );

    } catch (err) {

      console.error(err);

      showToast(
        "Erro ao salvar."
      );
    }
  }
);


// ===============================
// BOTÕES DA TABELA
// ===============================

daysBody.addEventListener(
  "click",
  async e => {

    const btn =
      e.target.closest(
        "button[data-action]"
      );


    if (!btn) return;


    const id =
      btn.dataset.id;


    // DESPESAS

    if (
      btn.dataset.action ===
      "expenses"
    ) {

      selectedDay = id;

      renderExpenses();


      document
        .querySelector(
          ".expense-panel"
        )
        .scrollIntoView({
          behavior: "smooth"
        });
    }


    // EXCLUIR

    if (
      btn.dataset.action ===
      "delete"
    ) {

      try {

        await deleteDay(id);

      } catch (err) {

        console.error(err);

        showToast(
          "Erro ao excluir."
        );
      }
    }
  }
);


// ===============================
// BOTÃO ADICIONAR DIA
// ===============================

document
  .getElementById("addDayBtn")
  .addEventListener(
    "click",
    createAllDays
  );


// ===============================
// TROCA DE MÊS
// ===============================

monthPicker.addEventListener(
  "change",
  () => {

    selectedDay = null;

    render();
  }
);


// ===============================
// ADICIONAR DESPESA
// ===============================

document
  .getElementById("addExpenseBtn")
  .addEventListener(
    "click",
    async () => {

      const description =
        expenseDescription.value.trim();


      const value =
        Number(
          expenseValue.value
        );


      if (
        !selectedDay ||
        !description ||
        !(value > 0)
      ) {

        showToast(
          "Preencha descrição e valor."
        );

        return;
      }


      await addDoc(
        expensesRef,
        {

          month:
            monthPicker.value,

          dayId:
            selectedDay,

          description,

          value,

          createdAt:
            Date.now()

        }
      );


      expenseDescription.value =
        "";

      expenseValue.value =
        "";


      showToast(
        "Despesa adicionada."
      );
    }
  );


// ===============================
// EXCLUIR DESPESA
// ===============================

expensesList.addEventListener(
  "click",
  async e => {

    const btn =
      e.target.closest(
        "button[data-expense-delete]"
      );


    if (!btn) return;


    if (
      !confirm(
        "Excluir esta despesa?"
      )
    ) {

      return;
    }


    await deleteDoc(
      doc(
        db,
        expensesRef.path,
        btn.dataset.expenseDelete
      )
    );


    showToast(
      "Despesa excluída."
    );
  }
);


// ===============================
// FIRESTORE - DIAS
// ===============================

onSnapshot(
  daysRef,
  snap => {

    days = {};


    snap.forEach(
      d =>
        days[d.id] =
          d.data()
    );


    render();

  },
  err => {

    console.error(err);

    showToast(
      "Erro ao conectar ao Firestore."
    );
  }
);


// ===============================
// FIRESTORE - DESPESAS
// ===============================

onSnapshot(
  expensesRef,
  snap => {

    expenses = {};


    snap.forEach(
      d =>
        expenses[d.id] = {
          id: d.id,
          ...d.data()
        }
    );


    render();

  },
  err => {

    console.error(err);

    showToast(
      "Erro ao carregar despesas."
    );
  }
);


// ===============================
// INICIAR
// ===============================

render();
