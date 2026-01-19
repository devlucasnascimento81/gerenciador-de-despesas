const transactionForm = document.getElementById('transactionForm')
const descriptionInput = document.getElementById('description')
const amountInput = document.getElementById('amount')
const categoryInput = document.getElementById('category')
const typeInput = document.getElementById('type')
const dateInput = document.getElementById('date')

const totalIncomeEl = document.getElementById('totalIncome')
const totalExpenseEl = document.getElementById('totalExpense')
const totalBalanceEl = document.getElementById('totalBalance')

const transactionsList = document.getElementById('transactionsList')
const emptyMessage = document.getElementById('emptyMessage')

const filterBtns = document.querySelectorAll('.filter-btn')

// ========================================
// VARIÁVEIS GLOBAIS
// ========================================

let transactions = []
let currentFilter = 'all'
let editingId =  null

// ========================================
// INICIALIZAÇÃO
// ========================================

init()

function init() {
    console.log('inicializando apps...')

    // Define data de hoje como padrão
    setTodayDate()

    // Carrega transações do localStorage
    loadTransactions()

    // Renderiza tudo na tela
    render()

    // Event Listeners
    setupEventListeners()
}

// EVENT LISTENERS

function setupEventListeners() {
    //formulário: adicionar transação
    transactionForm.addEventListener('submit', handleFormSubmit)

    //filtros: mudar visualização
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterClick)
    })
}

//FUNÇÕES DE CONTROLE

// define data de hoje no input
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0]
    dateInput.value = today
}

// carrega transações do localStorage
function loadTransactions() {
    const saved = localStorage.getItem('transactions')
    if (saved) {
        transactions = JSON.parse(saved)
        console.log('Transações carregadas:', transactions)
    }
}

//salva transações no localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions))
    console.log('Transações salvas!')
}

//renderiza tudo na tela
function render() {
    renderTransactions()
    renderBalance()
}

//ADICIONAR/ATUALIZAR TRANSAÇÃO
// ========================================
function handleFormSubmit(event) {
    event.preventDefault()
    
    const description = descriptionInput.value.trim()
    const amount = parseFloat(amountInput.value)
    const category = categoryInput.value
    const type = typeInput.value
    const date = dateInput.value
    
    if (!description || !amount || !category || !date) {
        alert('Preencha todos os campos!')
        return
    }
    
    if (editingId !== null) {
        updateTransaction(editingId, { description, amount, category, type, date })
    } else {
        addTransaction({ description, amount, category, type, date })
    }
}

function addTransaction(data) {
    const transaction = {
        id: Date.now(),
        ...data
    }
    
    console.log('Nova transação:', transaction)
    
    transactions.push(transaction)
    saveTransactions()
    render()
    resetForm()
    
    showNotification('Transação adicionada com sucesso!', 'success')
}

function updateTransaction(id, data) {
    const index = transactions.findIndex(t => t.id === id)
    
    if (index === -1) {
        alert('Transação não encontrada!')
        return
    }
    
    transactions[index] = {
        id,
        ...data
    }
    
    console.log('Transação atualizada:', transactions[index])
    
    saveTransactions()
    render()
    resetForm()
    
    showNotification('Transação atualizada com sucesso!', 'success')
}

// Reseta o formulário para o estado inicial
function resetForm() {
    transactionForm.reset()
    setTodayDate()
    editingId = null
    
    // Volta o botão ao estado original
    const submitBtn = transactionForm.querySelector('button[type="submit"]')
    submitBtn.textContent = 'Adicionar Transação'
    submitBtn.style.background = '' // Remove estilo inline (volta pro CSS)
}
    



//RENDERIZAR TRANSAÇÕES
function renderTransactions() {
    let filteredTransactions = transactions

    if (currentFilter === 'income') {
        filteredTransactions = transactions.filter(t => t.type === 'income')
    } else if (currentFilter === 'expense') {
        filteredTransactions =transactions.filter(t => t.type === 'expense')
    }

    // se não tuver transações, mostra mensagem vazia
    if (filteredTransactions.length === 0) {
        emptyMessage.classList.remove('hidden')
        transactionsList.innerHTML = ''
        return
    }

    //esconde mensagem vazia
    emptyMessage.classList.add('hidden')

    //limpa a lista
    transactionsList.innerHTML = ''

    //ordena por data (mais recentes primeiro)
    const sorted = [...filteredTransactions].sort((a,b) => {
        return new Date(b.date) - new Date(a.date)
    })

    //cria html para cada transação 
    sorted.forEach(transaction => {
        const li = createTransactionElement(transaction)
        transactionsList.appendChild(li)
    })
}

//cria elemento html de uma transação
function createTransactionElement(transaction) {
    const li = document.createElement('li')
    li.className = `transaction-item ${transaction.type}`

    //formata a data
    const formattedDate = formatDate(transaction.date)

    //emoji da categoria 
    const categoryEmoji = getCategoryEmoji(transaction.category)

    //sinal + ou - no valor
    const sign = transaction.type === 'income' ? '+' : '-'

    li.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-description">
                ${categoryEmoji} ${transaction.description}
            </div>
            <div class="transaction-details">
                <span>${transaction.category}</span>
                <span>${formattedDate}</span>
            </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
            ${sign} R$ ${transaction.amount.toFixed(2)}
        </div>
        <div class="transaction-actions">
            <button class="btn-edit" onclick="editTransaction(${transaction.id})">
                ✏️ Editar
            </button>
            <button class="btn-delete" onclick="deleteTransaction(${transaction.id})">
                🗑️ Excluir
            </button>
        </div>
    `
    return li
}

//RENDERIZA BALANÇO
function renderBalance() {
    //calcula total de despesas
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    //calcula total de despesas
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
        
    //calcula balanço
    const balance = income - expense 
    
    //atualiza na tela 
    totalIncomeEl.textContent = `R$ ${income.toFixed(2)}`
    totalExpenseEl.textContent = `R$ ${expense.toFixed(2)}`
    totalBalanceEl.textContent = `R$ ${balance.toFixed(2)}`

    // muda cor do balanço (verde/vermelho)
    totalBalanceEl.style.color = balance >= 0 ? 'white' : '#fee2e2'
}

//FILTROS

function handleFilterClick(event) {
    const filter = event.target.dataset.filter

    //remove 'active' de todos
    filterBtns.forEach(btn => btn.classList.remove('active'))

    // Adiciona 'active' no clicado
    event.target.classList.add('active')

    //atualiza filtro atual
    currentFilter = filter

    // re-renderiza
    renderTransactions()

}

//DELETAR TRANSAÇÃO

function deleteTransaction(id) {
    //confirma antes de deletar
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
        return
    }

    //remove do array
    transactions = transactions.filter(t => t.id !== id)

    //salva e atualiza
    saveTransactions()
    render()

    console.log('Transação deletada!')
}

//editar transação 
function editTransaction(id) {
    //encontra a transação  pelo id
    const transaction = transactions .find(t => t.id === id)

    if(!transaction) {
        alert('Transação não encontrada!')
        return
    }
    console.log('Editando transações:' , transaction)

    // preenche o formulário com os dados 
    descriptionInput.value = transaction.description
    amountInput.value = transaction.amount
    categoryInput.value = transaction.category
    typeInput.value = transaction.type
    dateInput.value = transaction.date

    //muda o texto do botão
    const submitBtn = transactionForm.querySelector('button[type="submit"]')
    submitBtn.textContent = 'Atualizar Transação'
    submitBtn.style.background = '#f59e0b'

    //guarda o ID que está sendo editado
    editingId = id

    // scroll suave até o formulario
    transactionForm.scrollIntoView({ behavior: 'smooth'})
    
}

// NOTIFICAÇÕES
function showNotification(message, type = 'success') {
    // Remove notificação antiga se existir
    const oldNotification = document.querySelector('.notification')
    if (oldNotification) {
        oldNotification.remove()
    }
    
    // Cria nova notificação
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    // Remove após 3 segundos
    setTimeout(() => {
        notification.classList.add('fade-out')
        setTimeout(() => notification.remove(), 300)
    }, 3000)
}

// FUNÇÕES AUXILIARES

// Formata data de YYYY-MM-DD para DD/MM/YYYY
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
}

// Retorna emoji baseado na categoria
function getCategoryEmoji(category) {
    const emojis = {
        salario: '💼',
        freelance: '💻',
        investimento: '📈',
        alimentacao: '🍔',
        transporte: '🚗',
        saude: '🏥',
        lazer: '🎮',
        educacao: '📚',
        moradia: '🏠',
        outros: '📦'
    }
    return emojis[category] || '📦'
}