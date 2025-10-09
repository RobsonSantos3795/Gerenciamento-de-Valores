 // Importa as funções necessárias do SDK do Firebase v12.3.0
        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
        import { 
            getDatabase, 
            ref, 
            onValue, 
            push, 
            update, 
            remove 
        } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

        // ** 1. CONFIGURAÇÃO DO FIREBASE **
        const firebaseConfig = {
            apiKey: "AIzaSyAyXbRqR4FSATR6sMq6w85gxaLNy2JQDNk",
            authDomain: "gerenciadordenomes.firebaseapp.com",
            databaseURL: "https://gerenciadordenomes-default-rtdb.firebaseio.com",
            projectId: "gerenciadordenomes",
            storageBucket: "gerenciadordenomes.firebasestorage.app",
            messagingSenderId: "550132112859",
            appId: "1:550132112859:web:8b120e6d413e6546a79bfe"
        };

        // Inicializa o Firebase e o Realtime Database
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const nomesRef = ref(db, 'nomes');


        // ** 2. REFERÊNCIAS DO DOM **
        const nameForm = document.getElementById('nameForm');
        const nameInput = document.getElementById('nameInput');
        const valueInput = document.getElementById('valueInput'); // NOVO: Input de valor
        const namesList = document.getElementById('namesList');
        const submitButton = document.getElementById('submitButton');
        const keyToEdit = document.getElementById('keyToEdit');
        const totalValueDisplay = document.getElementById('totalValueDisplay'); // NOVO: Display de total

        /**
         * Limpa e reseta o estado do formulário após uma operação de edição.
         */
        function resetForm() {
            nameInput.value = '';
            valueInput.value = ''; // Reset do valor
            submitButton.textContent = 'Adicionar Item'; // Texto do botão ajustado
            keyToEdit.value = '';
        }

        // ** 3. FUNÇÃO CREATE (CRIAR) & UPDATE (ATUALIZAR) **
        nameForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const nome = nameInput.value.trim();
            // Garante que o valor seja um número de ponto flutuante e, se for inválido, assume 0
            const valor = parseFloat(valueInput.value) || 0; 
            const key = keyToEdit.value;

            if (nome === "") {
                console.error("O nome do item não pode ser vazio."); 
                return;
            }
            
            if (isNaN(valor) || valor < 0) {
                console.error("O valor deve ser um número positivo.");
                return;
            }

            try {
                // Prepara os dados a serem salvos
                const data = { nome: nome, valor: valor };

                if (key) {
                    // MODO UPDATE (ATUALIZAR)
                    const itemRef = ref(db, `nomes/${key}`);
                    await update(itemRef, data);
                    console.log(`Item atualizado: ${nome} (R$ ${valor.toFixed(2)})`);
                    resetForm();

                } else {
                    // MODO CREATE (CRIAR)
                    // O 'push' cria a chave única
                    await push(nomesRef, data);
                    console.log(`Item adicionado: ${nome} (R$ ${valor.toFixed(2)})`);
                    nameInput.value = ''; 
                    valueInput.value = ''; // Limpa o input de valor
                }
            } catch (error) {
                console.error("Erro na operação de salvar/atualizar: ", error);
            }
        });


        // ** 4. FUNÇÃO READ (LER) e CÁLCULO DO TOTAL - EM TEMPO REAL **
        onValue(nomesRef, (snapshot) => {
            namesList.innerHTML = ''; 
            let totalGeral = 0; // Inicializa o acumulador

            if (snapshot.exists()) {
                const nomes = snapshot.val(); 
                
                // Converte o objeto para um array para facilitar a iteração
                const itemsArray = [];
                for (let key in nomes) {
                    itemsArray.push({ key, ...nomes[key] });
                }
                
                itemsArray.forEach(item => {
                    // Garante que o valor é tratado como número para a soma
                    const valorNumerico = parseFloat(item.valor) || 0; 
                    totalGeral += valorNumerico; // Acumula o valor

                    // Formata o valor para exibição (Moeda Brasileira)
                    const valorFormatado = valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    
                    const listItem = document.createElement('li');
                    listItem.setAttribute('data-key', item.key);
                    
                    listItem.innerHTML = `
                        <span class="name-display">${item.nome}</span>
                        <span class="value-display">${valorFormatado}</span> 
                        <div class="actions">
                            <!-- Adiciona data-valor para preencher o input na edição -->
                            <button class="edit-btn" data-key="${item.key}" data-nome="${item.nome}" data-valor="${item.valor}">Editar</button>
                            <button class="delete-btn" data-key="${item.key}" data-nome="${item.nome}">Deletar</button>
                        </div>
                    `;
                    
                    // Adiciona os Listeners para os botões de Ação
                    listItem.querySelector('.edit-btn').addEventListener('click', (e) => {
                        handleEdit(e.target.dataset.key, e.target.dataset.nome, e.target.dataset.valor);
                    });

                    listItem.querySelector('.delete-btn').addEventListener('click', (e) => {
                        handleDelete(e.target.dataset.key, e.target.dataset.nome);
                    });

                    namesList.appendChild(listItem);
                });
                
                // Atualiza o display do total
                const totalFormatado = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                totalValueDisplay.innerHTML = `Total Acumulado: ${totalFormatado}`;

            } else {
                namesList.innerHTML = '<li>Nenhum item cadastrado ainda. Adicione um acima!</li>';
                totalValueDisplay.innerHTML = 'Total Acumulado: R$ 0,00'; // Reseta o total
            }
        }, (error) => {
            console.error("Erro ao ler os dados do Firebase: ", error);
            namesList.innerHTML = '<li>Erro ao carregar dados. Verifique sua conexão e regras do Firebase.</li>';
            totalValueDisplay.innerHTML = 'Total Acumulado: R$ 0,00';
        });

        // ** 5. FUNÇÃO AUXILIAR DE EDIÇÃO (UPDATE) **
        function handleEdit(key, nomeAtual, valorAtual) {
            // 1. Preenche os inputs de nome e valor e armazena a chave
            nameInput.value = nomeAtual;
            valueInput.value = valorAtual; // Preenche o valor
            keyToEdit.value = key;
            
            // 2. Altera o texto do botão
            const valorFormatado = parseFloat(valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' });
            submitButton.textContent = `Atualizar: ${nomeAtual} (${valorFormatado})`;

            // 3. Move o foco
            nameInput.focus();
        }

        // ** 6. FUNÇÃO DELETE (DELETAR) **
        async function handleDelete(key, nome) {
            // Usa 'confirm' já existente, mas ajusta a mensagem
            if (confirm(`Confirma a exclusão do item "${nome}" e seu valor associado?`)) { 
                try {
                    const itemRef = ref(db, `nomes/${key}`);
                    await remove(itemRef);
                    console.log(`Item deletado com sucesso: ${nome}`);
                    if (keyToEdit.value === key) {
                        resetForm();
                    }
                } catch (error) {
                    console.error("Erro ao deletar item: ", error);
                }
            }
        }