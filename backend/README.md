# Backend - Fila Solidária

## Tecnologias

- **Node.js** v18+ - Runtime JavaScript
- **TypeScript** v5+ - Superset tipado do JavaScript
- **Express** v4+ - Framework web minimalista
- **MongoDB** - Banco de dados NoSQL
- **Prisma** v5+ - ORM moderno e type-safe

## 🏗️ Arquitetura

O projeto segue uma **arquitetura em camadas** (Layered Architecture) que separa responsabilidades de forma clara:

```mermaid
graph TB
    Client[Cliente - Front-end]
    
    subgraph "Backend - Fila Solidária"
        Routes[Rotas - Express Router]
        Middlewares[Middlewares]
        Controllers[Controllers]
        Services[Services - Lógica de Negócio]
        Repositories[Repositories - Acesso a Dados]
        Database[(MongoDB + Prisma)]
    end
    
    Client -->|HTTP Request| Routes
    Routes --> Middlewares
    Middlewares -->|Validação OK| Controllers
    Controllers -->|Chama| Services
    Services -->|Usa| Repositories
    Repositories -->|Query| Database
    Database -->|Resultado| Repositories
    Repositories -->|Dados| Services
    Services -->|Resposta| Controllers
    Controllers -->|JSON Response| Client
    
    style Client fill:#e1f5ff
    style Routes fill:#fff4e1
    style Middlewares fill:#ffe1f5
    style Controllers fill:#e1ffe1
    style Services fill:#f5e1ff
    style Repositories fill:#ffe1e1
    style Database fill:#e1e1ff
```

### Camadas da Aplicação

#### 1. **Rotas (Routes)**

- Define os endpoints HTTP da API
- Aplica middlewares específicos para cada rota
- Conecta URLs aos métodos dos controllers

#### 2. **Middlewares**

- **Autenticação**: Verifica tokens JWT
- **Validação**: Valida dados de entrada com Zod
- **Tratamento de Erros**: Captura e formata erros
- **Logging**: Registra requisições e erros

#### 3. **Controllers**

- Recebe requisições HTTP
- Extrai dados (body, params, query, headers)
- Chama services apropriados
- Formata respostas JSON
- **NÃO contém lógica de negócio**

#### 4. **Services**

- Contém toda a **lógica de negócio**
- Orquestra operações complexas
- Usa múltiplos repositories
- Valida regras de negócio
- **NÃO acessa banco diretamente**

#### 5. **Repositories**

- Única camada que acessa o banco de dados
- Encapsula queries do Prisma
- Fornece métodos CRUD limpos
- **NÃO contém lógica de negócio**

### Benefícios desta Arquitetura

- **Separação de Responsabilidades**: Cada camada tem um propósito específico  
- **Testabilidade**: Fácil criar testes unitários para cada camada  
- **Manutenibilidade**: Mudanças isoladas em uma camada não afetam outras  
- **Reusabilidade**: Services podem ser usados por múltiplos controllers  
- **Escalabilidade**: Fácil adicionar novas funcionalidades seguindo o padrão

## Diagramas

### Diagrama de Fluxo de Requisição

Este diagrama mostra o caminho completo de uma requisição HTTP desde o cliente até a resposta:

```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as Router
    participant MW as Middlewares
    participant CT as Controller
    participant S as Service
    participant RP as Repository
    participant DB as MongoDB

    C->>R: POST /api/auth/login
    R->>MW: Aplica middlewares
    
    Note over MW: 1. Request Logger
    MW->>MW: Loga requisição
    
    Note over MW: 2. Validation Middleware
    MW->>MW: Valida com Zod Schema
    alt Validação Falha
        MW-->>C: 400 Bad Request
    end
    
    MW->>CT: loginController.login()
    CT->>S: authService.login(data)
    
    Note over S: Aplica lógica de negócio
    S->>RP: userRepository.findByEmail()
    RP->>DB: Prisma Query
    DB-->>RP: User data
    RP-->>S: User object
    
    S->>S: Compara senha (bcrypt)
    alt Senha Inválida
        S-->>CT: UnauthorizedError
        CT-->>C: 401 Unauthorized
    end
    
    S->>S: Gera JWT Token
    S-->>CT: { token, user }
    CT-->>C: 200 OK + JSON
    
    Note over MW: 3. Response Logger
    MW->>MW: Loga resposta + tempo
```

### Princípios de Design Aplicados

- **DRY (Don't Repeat Yourself)**: Código reutilizável em utilities e helpers
- **SOLID**: Especialmente SRP (Single Responsibility Principle) em cada camada
- **Clean Code**: Nomes descritivos, funções pequenas e focadas
- **Error Handling**: Tratamento centralizado de erros com classes customizadas
- **Type Safety**: TypeScript em 100% do código para segurança em tempo de desenvolvimento.

## Diagrama de Entidade-Relacionamento (ER)

### Modelo de Dados Completo

```mermaid
erDiagram
    User ||--o{ Donation : "cria (doador)"
    User ||--o{ Donation : "recebe (receptor)"
    User ||--o{ Candidacy : "se candidata"
    User ||--o{ ProfileEditHistory : "tem histórico"
    User ||--o{ RevokedToken : "revoga tokens"
    User ||--o{ PasswordResetToken : "solicita reset"
    
    Donation ||--o{ Candidacy : "recebe candidaturas"
    Donation ||--o{ DonationEditHistory : "tem histórico"
    Donation ||--o| DonationProgress : "tem progresso"
    
    User {
        ObjectId id PK
        string email "Único, validado"
        string password "Hash bcrypt"
        string name
        int age "Mínimo 13"
        string postalCode "CEP validado"
        string city
        string state "2 caracteres"
        string street
        string houseNumber
        string neighborhood
        string biography "Opcional"
        string phone "Validado"
        string contactEmail
        string contactPhone
        string socialNetworks "Opcional"
        datetime createdAt
    }
    
    Donation {
        ObjectId id PK
        int sequentialId "ID amigável"
        string title
        string description
        datetime createdAt
        enum status "OPEN|IN_PROGRESS|PICKED_UP|COMPLETED"
        enum pickupType "PICK_UP_AT_LOCATION|ARRANGE_WITH_DONOR"
        string postalCode
        string street
        string locationNumber
        string neighborhood
        string city
        string state
        enum category "FOOD|APPLIANCES|FURNITURE|etc"
        string returnReason "Opcional"
        ObjectId donorId FK
        ObjectId receiverId FK "Opcional"
    }
    
    Candidacy {
        ObjectId id PK
        ObjectId donationId FK
        ObjectId userId FK
        datetime createdAt
    }
    
    DonationProgress {
        ObjectId id PK
        ObjectId donationId FK "Um por doação"
        boolean pickupConfirmedByDonor
        boolean pickupConfirmedByReceiver
        boolean completionConfirmedByDonor
        boolean completionConfirmedByReceiver
        boolean returnSignaledByReceiver
        boolean returnConfirmedByDonor
        boolean returnConfirmedByReceiver
    }
    
    ProfileEditHistory {
        ObjectId id PK
        ObjectId userId FK
        datetime editedAt
        json changedFields "old/new values"
    }
    
    DonationEditHistory {
        ObjectId id PK
        ObjectId donationId FK
        datetime editedAt
        json changedFields "old/new values"
    }
    
    RevokedToken {
        ObjectId id PK
        string token UK
        ObjectId userId FK
        datetime revokedAt
        datetime expiresAt
    }
    
    PasswordResetToken {
        ObjectId id PK
        string token UK
        ObjectId userId FK
        datetime createdAt
        datetime expiresAt
        boolean used
    }
    
    Counter {
        ObjectId id PK
        string name UK "donation_sequential_id"
        int value "Contador incremental"
    }
```

### Descrição das Entidades

#### User (Usuário)

Representa tanto doadores quanto receptores. Não há distinção de perfis - qualquer usuário pode doar e receber.

**Regras de Negócio:**

- Email único (constraint no banco)
- Idade mínima de 13 anos
- Senha armazenada com hash bcrypt (nunca em texto puro)
- Histórico de edições visível apenas para administradores
- Cascade delete: ao excluir usuário, remove todas doações, candidaturas e históricos

#### Donation (Doação)

Item sendo doado por um usuário. Passa por vários status durante seu ciclo de vida.

**Ciclo de Vida:**

1. **OPEN**: Doação criada, visível ao público, aceitando candidaturas
2. **IN_PROGRESS**: Receptor escolhido, aguardando retirada
3. **PICKED_UP**: Retirada confirmada por ambos, aguardando conclusão
4. **COMPLETED**: Doação finalizada com sucesso

**Regras de Negócio:**

- Só pode editar/excluir se status = **OPEN**
- `sequentialId` gerado automaticamente (ID amigável tipo #1234)
- `pickupType` define se receptor busca no endereço ou combina com doador
- `returnReason` só é preenchido quando há processo de devolução
- Histórico de edições é público para transparência

#### Candidacy (Candidatura)

Manifesta interesse de um usuário em receber uma doação específica.

**Regras de Negócio:**

- Constraint única: um usuário só pode se candidatar uma vez por doação
- Usuário não pode se candidatar para própria doação
- Só pode se candidatar para doações com status **OPEN**
- Todas as candidaturas exceto a escolhida são deletadas quando doador escolhe receptor

#### DonationProgress (Progresso da Doação)

Rastreia os checkboxes de confirmação entre doador e receptor.

**Fluxo de Checkboxes:**

1. Ambos confirmam retirada → Status vira **PICKED_UP**
2. Ambos confirmam conclusão → Status vira **COMPLETED**
3. Se receptor sinaliza devolução:
   - Ambos devem confirmar devolução
   - Status volta para **OPEN**
   - Progresso é deletado

**Regras de Negócio:**

- Só existe se doação tem receptor escolhido
- Doador só marca checkboxes `ByDonor`
- Receptor só marca checkboxes `ByReceiver`
- Conclusão só habilitada após retirada confirmada
- Devolução só possível após retirada confirmada

#### ProfileEditHistory (Histórico de Edição de Perfil)

Registra todas as alterações feitas no perfil do usuário.

**Campos Rastreados:**

- Data da edição
- Campos modificados (nome, campo e valores antigo/novo)

**Acesso:**

- Privado - apenas administradores podem ver
- Útil para auditoria e detecção de atividades suspeitas

#### DonationEditHistory (Histórico de Edição de Doação)

Registra todas as alterações feitas em doações.

**Campos Rastreados:**

- Data da edição
- Campos modificados com valores antigo/novo

**Acesso:**

- Público - qualquer pessoa pode ver
- Aumenta transparência da plataforma
- Permite que candidatos vejam se doação mudou após se candidatarem

#### RevokedToken (Token Revogado)

Lista de tokens JWT que foram invalidados (logout).

**Propósito:**

- Implementa logout "real" em sistema JWT
- Tokens permanecem na lista até expirarem naturalmente
- Limpeza periódica de tokens expirados

#### PasswordResetToken (Token de Reset de Senha)

Tokens temporários para recuperação de senha.

**Características:**

- Expira em 1 hora
- Pode ser usado apenas uma vez (flag `used`)
- Limite de 3 tokens válidos simultâneos por usuário
- Invalidado após uso bem-sucedido

#### Counter (Contador)

Gera IDs sequenciais para doações.

**Propósito:**

- MongoDB usa `ObjectIds` (não amigáveis)
- Counter gera IDs sequenciais (#1, #2, #3...)
- Útil para referências e compartilhamento

### Relacionamentos Importantes

#### User ↔ Donation (1:N - Doador)

Um usuário pode criar várias doações, mas cada doação tem apenas um doador.

```typescript
// User side
donations: Donation[] @relation("DonorDonations")

// Donation side
donorId: ObjectId
donor: User @relation("DonorDonations")
```

#### User ↔ Donation (1:N - Receptor)

Um usuário pode receber várias doações, mas cada doação tem no máximo um receptor.

```typescript
// User side
receivedDonations: Donation[] @relation("ReceiverDonations")

// Donation side
receiverId?: ObjectId
receiver?: User @relation("ReceiverDonations")
```

#### Donation ↔ DonationProgress (1:1)

Cada doação pode ter um único registro de progresso.

```typescript
// Donation side
progress?: DonationProgress

// DonationProgress side
donationId: ObjectId @unique
```

### Índices e Performance

**Índices Automáticos:**

- Todos os `@id` são indexados
- Todos os `@unique` são indexados
- Todas as foreign keys são indexadas

**Índices Recomendados para Produção:**

```prisma
@@index([status, createdAt]) // Listagem de doações
@@index([city, state])        // Busca por localização
@@index([category])           // Filtro por categoria
```

## Diagrama de Classes

### Camada de Services e Repositories

```mermaid
classDiagram
    class AuthService {
        -userRepository: UserRepository
        -authRepository: AuthRepository
        +register(data: CreateUserData) LoginResponse
        +login(data: LoginData) LoginResponse
        +logout(token: string) void
        +forgotPassword(email: string) void
        +resetPassword(token: string, newPassword: string) void
        +isTokenRevoked(token: string) boolean
    }
    
    class UserService {
        -userRepository: UserRepository
        +getProfile(userId: string) User
        +getPublicProfile(userId: string) PublicProfile
        +updateProfile(userId: string, data: UpdateUserData) User
        +updatePassword(userId: string, currentPassword: string, newPassword: string) void
        +deleteAccount(userId: string) void
        +getProfileEditHistory(userId: string, requestingUserId: string) ProfileEditHistory[]
        +getUserStats(userId: string) UserStats
    }
    
    class DonationService {
        -donationRepository: DonationRepository
        -candidacyRepository: CandidacyRepository
        -progressRepository: DonationProgressRepository
        -userRepository: UserRepository
        +createDonation(donorId: string, data: CreateDonationData) Donation
        +listDonations(filters: DonationFilters, page: int, limit: int) PaginatedResponse
        +getDonation(donationId: string) Donation
        +updateDonation(donationId: string, userId: string, data: UpdateDonationData) Donation
        +deleteDonation(donationId: string, userId: string) void
        +applyForDonation(donationId: string, userId: string) Candidacy
        +getDonationCandidates(donationId: string, requestingUserId: string) Candidacy[]
        +withdrawCandidacy(donationId: string, userId: string) void
        +chooseReceiver(donationId: string, receiverId: string, donorId: string) Donation
        +cancelReceiving(donationId: string, userId: string) void
        +updateProgress(donationId: string, userId: string, updates: ProgressUpdates) Donation
        +signalReturn(donationId: string, userId: string, reason: string) void
        +confirmReturn(donationId: string, userId: string) void
        +getProgress(donationId: string, userId: string) ProgressSummary
    }
    
    class UserRepository {
        +create(data: CreateUserData) User
        +findById(id: string, includePassword: boolean) User
        +findByEmail(email: string, includePassword: boolean) User
        +update(id: string, data: UpdateUserData) User
        +delete(id: string) void
        +updatePassword(id: string, hashedPassword: string) void
        +saveProfileEditHistory(userId: string, changedFields: Record) ProfileEditHistory
        +getProfileEditHistory(userId: string) ProfileEditHistory[]
        +getPublicProfile(userId: string) PublicProfile
        +emailExists(email: string) boolean
        +getUserStats(userId: string) UserStats
    }
    
    class DonationRepository {
        +getNextSequentialId() int
        +create(donorId: string, data: CreateDonationData) Donation
        +findById(id: string) Donation
        +findMany(filters: DonationFilters, page: int, limit: int) PaginatedResponse
        +update(id: string, data: UpdateDonationData) Donation
        +delete(id: string) void
        +saveDonationEditHistory(donationId: string, changedFields: Record) DonationEditHistory
        +getDonationEditHistory(donationId: string) DonationEditHistory[]
        +findByDonor(donorId: string) Donation[]
        +findByReceiver(receiverId: string) Donation[]
        +updateStatus(id: string, status: DonationStatus) Donation
        +setReceiver(donationId: string, receiverId: string) Donation
        +removeReceiver(donationId: string) Donation
        +updateReturnReason(donationId: string, reason: string) Donation
    }
    
    class CandidacyRepository {
        +create(donationId: string, userId: string) Candidacy
        +findById(id: string) Candidacy
        +findByDonationAndUser(donationId: string, userId: string) Candidacy
        +findByDonation(donationId: string) Candidacy[]
        +findByUser(userId: string) Candidacy[]
        +delete(id: string) void
        +deleteByDonationAndUser(donationId: string, userId: string) void
        +deleteAllByDonation(donationId: string) int
        +countByDonation(donationId: string) int
        +hasCandidacy(donationId: string, userId: string) boolean
    }
    
    class DonationProgressRepository {
        +create(donationId: string) DonationProgress
        +findByDonation(donationId: string) DonationProgress
        +update(donationId: string, data: ProgressUpdates) DonationProgress
        +delete(donationId: string) void
        +isPickupConfirmed(donationId: string) boolean
        +isCompletionConfirmed(donationId: string) boolean
        +isReturnCompleted(donationId: string) boolean
        +canSignalReturn(donationId: string) boolean
        +canConfirmCompletion(donationId: string) boolean
        +getProgressSummary(donationId: string) ProgressSummary
    }
    
    class AuthRepository {
        +revokeToken(token: string, userId: string, expiresAt: Date) RevokedToken
        +isTokenRevoked(token: string) boolean
        +cleanExpiredRevokedTokens() int
        +createPasswordResetToken(userId: string, token: string, expiresAt: Date) PasswordResetToken
        +findPasswordResetToken(token: string) PasswordResetToken
        +markPasswordResetTokenAsUsed(tokenId: string) void
        +invalidateAllPasswordResetTokens(userId: string) void
        +cleanExpiredPasswordResetTokens() int
        +countValidPasswordResetTokens(userId: string) int
    }
    
    AuthService --> UserRepository : uses
    AuthService --> AuthRepository : uses
    UserService --> UserRepository : uses
    DonationService --> DonationRepository : uses
    DonationService --> CandidacyRepository : uses
    DonationService --> DonationProgressRepository : uses
    DonationService --> UserRepository : uses
```

### Hierarquia de Erros

```mermaid
classDiagram
    class AppError {
        +statusCode: number
        +isOperational: boolean
        +message: string
        +constructor(message: string, statusCode: number, isOperational: boolean)
    }
    
    class NotFoundError {
        +constructor(message: string)
    }
    
    class UnauthorizedError {
        +constructor(message: string)
    }
    
    class ForbiddenError {
        +constructor(message: string)
    }
    
    class ConflictError {
        +constructor(message: string)
    }
    
    class ValidationError {
        +constructor(message: string)
    }
    
    class InternalServerError {
        +constructor(message: string)
    }
    
    Error <|-- AppError
    AppError <|-- NotFoundError
    AppError <|-- UnauthorizedError
    AppError <|-- ForbiddenError
    AppError <|-- ConflictError
    AppError <|-- ValidationError
    AppError <|-- InternalServerError
```

**Uso dos Erros:**

- `NotFoundError (404)`: Recurso não encontrado (usuário, doação, etc)
- `UnauthorizedError (401)`: Não autenticado ou token inválido
- `ForbiddenError (403)`: Autenticado mas sem permissão
- `ConflictError (409)`: Conflito de dados (email duplicado, etc)
- `ValidationError (400)`: Dados inválidos na requisição
- `InternalServerError (500)`: Erro inesperado no servidor

## 🔄 Fluxos de Negócio

### Fluxo Completo de uma Doação

```mermaid
stateDiagram-v2
    [*] --> OPEN: Doação Criada
    
    OPEN --> OPEN: Editar/Excluir Doação
    OPEN --> OPEN: Usuários se Candidatam
    OPEN --> IN_PROGRESS: Doador Escolhe Receptor
    
    IN_PROGRESS --> OPEN: Receptor Cancela
    IN_PROGRESS --> PICKED_UP: Ambos Confirmam Retirada
    
    PICKED_UP --> COMPLETED: Ambos Confirmam Conclusão
    PICKED_UP --> ReturnProcess: Receptor Sinaliza Devolução
    
    ReturnProcess --> OPEN: Ambos Confirmam Devolução
    
    COMPLETED --> [*]: Doação Finalizada
    
    note right of OPEN
        Status OPEN:
        - Visível ao público
        - Aceita candidaturas
        - Pode ser editada/excluída
        - Apenas pelo doador
    end note
    
    note right of IN_PROGRESS
        Status IN_PROGRESS:
        - Receptor escolhido
        - Invisível ao público
        - Não pode editar/excluir
        - Aguardando confirmações
    end note
    
    note right of PICKED_UP
        Status PICKED_UP:
        - Retirada confirmada
        - Item com receptor
        - Pode concluir ou devolver
    end note
    
    note right of COMPLETED
        Status COMPLETED:
        - Doação finalizada
        - Ambos confirmaram
        - Não permite alterações
    end note
```

### Fluxo de Autenticação e Autorização

```mermaid
flowchart TD
    Start([Requisição HTTP]) --> HasAuth{Tem header Authorization?}
    
    HasAuth -->|Não| Public{Rota pública?}
    Public -->|Sim| Process[Processa Requisição]
    Public -->|Não| Reject401[401 Unauthorized]
    
    HasAuth -->|Sim| ValidFormat{Formato válido?}
    ValidFormat -->|Não| Reject401
    
    ValidFormat -->|Sim| VerifyJWT{Token JWT válido?}
    VerifyJWT -->|Não| Reject401
    
    VerifyJWT -->|Sim| CheckRevoked{Token revogado?}
    CheckRevoked -->|Sim| Reject401
    
    CheckRevoked -->|Não| AttachUser[Anexa user ao request]
    AttachUser --> CheckPermission{Tem permissão?}
    
    CheckPermission -->|Não| Reject403[403 Forbidden]
    CheckPermission -->|Sim| Process
    
    Process --> Success[200-299 Success]
    Process --> BusinessError{Erro de Negócio?}
    
    BusinessError -->|NotFound| Return404[404 Not Found]
    BusinessError -->|Conflict| Return409[409 Conflict]
    BusinessError -->|Validation| Return400[400 Bad Request]
    BusinessError -->|Unexpected| Return500[500 Internal Error]
    
    Reject401 --> End([Resposta ao Cliente])
    Reject403 --> End
    Success --> End
    Return404 --> End
    Return409 --> End
    Return400 --> End
    Return500 --> End
```

### Fluxo de Candidatura e Escolha de Receptor

```mermaid
sequenceDiagram
    actor U1 as Usuário 1 (Doador)
    actor U2 as Usuário 2
    actor U3 as Usuário 3
    participant S as Sistema
    participant DB as Banco de Dados

    U1->>S: POST /api/donations (Cria doação)
    S->>DB: Salva doação (status: OPEN)
    DB-->>S: Doação criada
    S-->>U1: 201 Created
    
    Note over S: Doação visível ao público
    
    U2->>S: POST /api/donations/:id/apply
    S->>DB: Cria candidatura (U2)
    S-->>U2: 201 Candidatura criada
    
    U3->>S: POST /api/donations/:id/apply
    S->>DB: Cria candidatura (U3)
    S-->>U3: 201 Candidatura criada
    
    U1->>S: GET /api/donations/:id/candidates
    S->>DB: Busca candidaturas
    DB-->>S: [U2, U3]
    S-->>U1: Lista de candidatos
    
    U1->>S: POST /api/donations/:id/choose-receiver<br/>{receiverId: U2}
    
    Note over S: Operações em sequência:
    S->>DB: 1. Update donation (receiverId=U2, status=IN_PROGRESS)
    S->>DB: 2. Cria DonationProgress
    S->>DB: 3. Delete candidatura de U3
    DB-->>S: Operações concluídas
    
    S-->>U1: 200 Receptor escolhido
    
    Note over S: Doação invisível ao público<br/>Apenas U1 e U2 veem
```

### Fluxo de Confirmações (Checkboxes)

```mermaid
flowchart TD
    Start([Doação IN_PROGRESS]) --> ShowPickup[Mostrar checkboxes de Retirada]
    
    ShowPickup --> D1{Doador confirma retirada?}
    D1 -->|Sim| Mark1[pickupConfirmedByDonor = true]
    
    ShowPickup --> R1{Receptor confirma retirada?}
    R1 -->|Sim| Mark2[pickupConfirmedByReceiver = true]
    
    Mark1 --> Check1{Ambos confirmaram?}
    Mark2 --> Check1
    
    Check1 -->|Não| Wait1[Aguarda confirmação da outra parte]
    Check1 -->|Sim| UpdateStatus1[Status → PICKED_UP]
    
    UpdateStatus1 --> ShowCompletion[Habilitar checkboxes de<br/>Conclusão e Devolução]
    
    ShowCompletion --> Choice{O que fazer?}
    
    Choice -->|Concluir| D2{Doador confirma conclusão?}
    Choice -->|Devolver| RSignal[Receptor sinaliza devolução<br/>+ Motivo]
    
    D2 -->|Sim| Mark3[completionConfirmedByDonor = true]
    ShowCompletion --> R2{Receptor confirma conclusão?}
    R2 -->|Sim| Mark4[completionConfirmedByReceiver = true]
    
    Mark3 --> Check2{Ambos confirmaram?}
    Mark4 --> Check2
    
    Check2 -->|Não| Wait2[Aguarda confirmação da outra parte]
    Check2 -->|Sim| UpdateStatus2[Status → COMPLETED]
    UpdateStatus2 --> End1([Doação Finalizada])
    
    RSignal --> Mark5[returnSignaledByReceiver = true<br/>returnReason = texto]
    Mark5 --> ShowReturn[Mostrar confirmações de Devolução]
    
    ShowReturn --> D3{Doador confirma devolução?}
    ShowReturn --> R3{Receptor confirma devolução?}
    
    D3 -->|Sim| Mark6[returnConfirmedByDonor = true]
    R3 -->|Sim| Mark7[returnConfirmedByReceiver = true]
    
    Mark6 --> Check3{Ambos confirmaram?}
    Mark7 --> Check3
    
    Check3 -->|Não| Wait3[Aguarda confirmação da outra parte]
    Check3 -->|Sim| Reset[Status → OPEN<br/>Remove receiver<br/>Deleta progress<br/>Limpa returnReason]
    
    Reset --> End2([Doação volta a estar disponível])
```

## Instalação

### Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior (vem com Node.js)
- **MongoDB** v5 ou superior (local ou Atlas)
- **Git** (para clonar o repositório)

### Passo a Passo

1. **Clone o repositório**

    ```bash
    git clone https://github.com/seu-usuario/filasolidaria-backend.git
    cd fila-solidaria-backend
    ```

2. **Instale as dependências**

    ```bash
    npm install
    ```

3. **Configure as variáveis de ambiente**

    Copie o arquivo `.env.example` para `.env`:

    ```bash
    cp .env.example .env
    ```

    Edite o arquivo `.env` com suas configurações:

    ```env
    # Servidor
    PORT=3333
    NODE_ENV=development

    # MongoDB
    DATABASE_URL="mongodb://localhost:27017/fila_solidaria"
    # Ou use MongoDB Atlas:
    # DATABASE_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/fila_solidaria"

    # JWT
    JWT_SECRET=sua_chave_secreta_super_segura_aqui_mude_em_producao
    JWT_EXPIRES_IN_WEB=7d
    JWT_EXPIRES_IN_MOBILE=365d

    # Email (use suas credenciais SMTP)
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=seu_email@gmail.com
    SMTP_PASS=sua_senha_de_aplicativo
    EMAIL_FROM=noreply@filasolidaria.com

    # Front-end URL (para links em emails)
    FRONTEND_URL=http://localhost:3000
    ```

4. **Gere o Prisma Client**

    ```bash
    npm run prisma:generate
    ```

5. **Sincronize o schema com o banco de dados**

    ```bash
    npm run prisma:push
    ```

6. **Inicie o servidor em modo de desenvolvimento**

    ```bash
    npm run dev
    ```

O servidor estará rodando em `http://localhost:3333`

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot-reload (tsx watch)

# Build e Produção
npm run build            # Compila TypeScript para JavaScript
npm start               # Inicia servidor em produção (requer build)

# Prisma
npm run prisma:generate # Gera o Prisma Client
npm run prisma:push     # Sincroniza schema com banco
npm run prisma:studio   # Abre interface visual do banco
```

## Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão | Obrigatório |
|----------|-----------|--------|-------------|
| `PORT` | Porta do servidor | 3333 | Não |
| `NODE_ENV` | Ambiente (development/production) | development | Não |
| `DATABASE_URL` | URL de conexão do MongoDB | - | **Sim** |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | - | **Sim** |
| `JWT_EXPIRES_IN_WEB` | Tempo de expiração token web | 7d | Não |
| `JWT_EXPIRES_IN_MOBILE` | Tempo de expiração token mobile | 365d | Não |
| `SMTP_HOST` | Host do servidor SMTP | smtp.gmail.com | **Sim** |
| `SMTP_PORT` | Porta do servidor SMTP | 587 | **Sim** |
| `SMTP_USER` | Usuário SMTP | - | **Sim** |
| `SMTP_PASS` | Senha SMTP | - | **Sim** |
| `EMAIL_FROM` | Email remetente | - | **Sim** |
| `FRONTEND_URL` | URL do front-end | <http://localhost:3000> | **Sim** |

### Configuração de Email (Gmail)

Para usar Gmail como servidor SMTP:

1. Acesse sua [Conta Google](https://myaccount.google.com/)
2. Vá em **Segurança** → **Verificação em duas etapas** (ative se não estiver)
3. Em **Senhas de app**, gere uma nova senha
4. Use essa senha no `SMTP_PASS`

**Importante:** Nunca use sua senha real do Gmail!

### MongoDB Local

Se você está usando MongoDB localmente:

1. **Instale o MongoDB**
   - [Download MongoDB Community](https://www.mongodb.com/try/download/community)

2. **Inicie o serviço**

    ```bash
    # Linux/Mac
    sudo systemctl start mongodb

    # Windows
    net start MongoDB
    ```

3. **Verifique se está rodando**

    ```bash
    mongosh
    # Deve abrir o shell do MongoDB
    ```

### MongoDB Atlas (Cloud)

Para usar MongoDB na nuvem:

1. Crie uma conta gratuita em [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster (Free tier é suficiente)
3. Configure acesso:
   - Adicione seu IP à whitelist
   - Crie um usuário de banco de dados
4. Obtenha a connection string
5. Cole no `.env` como `DATABASE_URL`

## Estrutura de Pastas

```plain-text
filasolidaria/backend/
├── src/
│   ├── config/              # Configurações globais
│   │   ├── database.ts      # Conexão Prisma/MongoDB
│   │   ├── jwt.ts           # Configuração JWT
│   │   └── email.ts         # Configuração Nodemailer
│   │ 
│   ├── lib/                 # Bibliotecas
│   │   └── prisma.ts        # Cria uma instância global do Prisma
│   │
│   ├── middlewares/                  # Middlewares do Express
│   │   ├── auth.middleware.ts        # Autenticação JWT
│   │   ├── validation.middleware.ts  # Validação Zod
│   │   ├── error.middleware.ts       # Tratamento de erros
│   │   └── logger.middleware.ts      # Logging de requisições
│   │
│   ├── modules/             # Entidades do sistema
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.service.ts
│   │   │
│   │   ├── candidacy/
│   │   │   ├── candidacy.controller.ts
│   │   │   ├── candidacy.repository.ts
│   │   │   ├── candidacy.routes.ts
│   │   │   ├── candidacy.schema.ts
│   │   │   └── candidacy.service.ts
│   │   │
│   │   ├── donation/
│   │   │   ├── donation.controller.ts
│   │   │   ├── donation.repository.ts
│   │   │   ├── donation.routes.ts
│   │   │   ├── donation.schema.ts
│   │   │   └── donation.service.ts
│   │   │
│   │   └── user/
│   │       ├── user.controller.ts
│   │       ├── user.repository.ts
│   │       ├── user.routes.ts
│   │       └── user.service.ts
│   │
│   ├── shared/
│   │    ├──  errors/              # Classes de erro customizadas
│   │    │      └── AppError.ts
│   │    └──  schemas/              # Schemas compartilhados
│   │         └── AppError.ts
│   │
│   ├── types/               # Tipos TypeScript
│   │   └── index.ts
│   │
│   ├── utils/               # Funções utilitárias
│   │   └── helpers.ts
│   │
│   │
│   └── server.ts            # Arquivo principal (entry point)
│
├── prisma/
│   └── schema.prisma        # Schema do banco de dados
│
├── .env.example             # Exemplo de variáveis de ambiente
├── .env                     # Variáveis de ambiente (não commitar)
├── .gitignore              # Arquivos ignorados pelo git
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configuração TypeScript
└── README.md               # Este arquivo
```

## 🧪 Testando a API

### Registro de Usuário

```bash
curl -X POST http://localhost:3333/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "confirmPassword": "senha123",
    "age": 25,
    "postalCode": "12345-678",
    "city": "São Paulo",
    "state": "SP",
    "street": "Rua das Flores",
    "houseNumber": "123",
    "neighborhood": "Centro",
    "phone": "(11) 98765-4321",
    "contactEmail": "joao@example.com",
    "contactPhone": "(11) 98765-4321"
  }'
```

### Login

```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123",
    "platform": "web"
  }'
```

Guarde o token retornado para usar nas próximas requisições!

### Criar Doação

```bash
curl -X POST http://localhost:3333/api/donations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Geladeira em bom estado",
    "description": "Geladeira Consul 280L, funcionando perfeitamente",
    "pickupType": "PICK_UP_AT_LOCATION",
    "category": "APPLIANCES",
    "postalCode": "12345-678",
    "street": "Rua das Flores",
    "locationNumber": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP"
  }'
```

### Listar Doações

```bash
# Todas as doações abertas
curl http://localhost:3333/api/donations?status=OPEN

# Filtrar por categoria e cidade
curl http://localhost:3333/api/donations?category=FOOD&city=São%20Paulo

# Com paginação
curl http://localhost:3333/api/donations?page=1&limit=20
```

## 📚 API Endpoints

### Legenda

- 🔓 **Pública**: Não requer autenticação
- 🔒 **Privada**: Requer token JWT no header `Authorization: Bearer TOKEN`

### Autenticação (`/api/auth`)

#### Registrar Novo Usuário

**POST** `/api/auth/register` 🔓

Cria uma nova conta de usuário e retorna token JWT.

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "confirmPassword": "senha123",
  "age": 25,
  "postalCode": "12345-678",
  "city": "São Paulo",
  "state": "SP",
  "street": "Rua das Flores",
  "houseNumber": "123",
  "neighborhood": "Centro",
  "biography": "Gosto de ajudar minha comunidade",
  "phone": "(11) 98765-4321",
  "contactEmail": "joao@example.com",
  "contactPhone": "(11) 98765-4321",
  "socialNetworks": "@joaosilva"
}
```

**Resposta 201:**

```json
{
  "status": "success",
  "message": "Usuário registrado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "email": "joao@example.com"
    }
  }
}
```

#### Login (endpoint)

**POST** `/api/auth/login` 🔓

Autentica usuário existente.

**Body:**

```json
{
  "email": "joao@example.com",
  "password": "senha123",
  "platform": "web"
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "email": "joao@example.com"
    }
  }
}
```

#### Logout

**POST** `/api/auth/logout` 🔒

Revoga o token atual.

**Headers:**

```plain-text
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Logout realizado com sucesso"
}
```

#### Recuperar Senha

**POST** `/api/auth/forgot-password` 🔓

Envia email com link para resetar senha.

**Body:**

```json
{
  "email": "joao@example.com"
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Se o email estiver cadastrado, você receberá instruções para recuperar sua senha"
}
```

#### Resetar Senha

**POST** `/api/auth/reset-password` 🔓

Cria nova senha usando token do email.

**Body:**

```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "novaSenha123",
  "confirmPassword": "novaSenha123"
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Senha redefinida com sucesso. Faça login com sua nova senha"
}
```

#### Verificar Token

**GET** `/api/auth/verify` 🔒

Verifica se o token ainda é válido.

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Token válido",
  "data": {
    "user": {
      "userId": "507f1f77bcf86cd799439011",
      "email": "joao@example.com",
      "platform": "web"
    }
  }
}
```

### Usuários (`/api/users`)

#### Obter Perfil Completo

**GET** `/api/users/profile` 🔒

Retorna perfil completo do usuário autenticado.

**Resposta 200:**

```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "joao@example.com",
    "name": "João Silva",
    "age": 25,
    "city": "São Paulo",
    "state": "SP",
    "biography": "Gosto de ajudar minha comunidade",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "stats": {
      "donationsCreated": 5,
      "donationsReceived": 3,
      "donationsInProgress": 1
    }
  }
}
```

#### Atualizar Perfil

**PATCH** `/api/users/profile` 🔒

Atualiza dados do perfil (atualização parcial).

**Body (todos os campos opcionais):**

```json
{
  "name": "João Pedro Silva",
  "city": "Rio de Janeiro",
  "biography": "Nova biografia"
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Perfil atualizado com sucesso",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "João Pedro Silva",
    "city": "Rio de Janeiro"
  }
}
```

#### Atualizar Senha

**PATCH** `/api/users/password` 🔒

Atualiza a senha do usuário.

**Body:**

```json
{
  "currentPassword": "senha123",
  "newPassword": "novaSenha456",
  "confirmPassword": "novaSenha456"
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Senha atualizada com sucesso"
}
```

#### Excluir Conta

**DELETE** `/api/users/account` 🔒

Exclui permanentemente a conta do usuário.

**Resposta 204:** *(No Content)*

#### Obter Perfil Público

**GET** `/api/users/:userId/public` 🔓

Retorna perfil público de qualquer usuário.

**Resposta 200:**

```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "João Silva",
    "city": "São Paulo",
    "state": "SP",
    "biography": "Gosto de ajudar minha comunidade",
    "socialNetworks": "@joaosilva",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "_count": {
      "donations": 5,
      "receivedDonations": 3
    }
  }
}
```

#### Obter Estatísticas

**GET** `/api/users/stats` 🔒

Retorna estatísticas do usuário autenticado.

**Resposta 200:**

```json
{
  "status": "success",
  "data": {
    "donationsCreated": 5,
    "donationsReceived": 3,
    "donationsInProgress": 1
  }
}
```

### Doações (`/api/donations`)

#### Criar Doação (endpoint)

**POST** `/api/donations` 🔒

Cria uma nova doação.

**Body:**

```json
{
  "title": "Geladeira em bom estado",
  "description": "Geladeira Consul 280L, funcionando perfeitamente. Vendo porque comprei uma nova.",
  "pickupType": "PICK_UP_AT_LOCATION",
  "category": "APPLIANCES",
  "postalCode": "12345-678",
  "street": "Rua das Flores",
  "locationNumber": "123",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP"
}
```

**pickupType:** `PICK_UP_AT_LOCATION` ou `ARRANGE_WITH_DONOR`  
**category:** `FOOD`, `APPLIANCES`, `FURNITURE`, `CLOTHING`, `ELECTRONICS`, `EQUIPMENT`, `HOME`

**Resposta 201:**

```json
{
  "status": "success",
  "message": "Doação criada com sucesso",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "sequentialId": 1234,
    "title": "Geladeira em bom estado",
    "status": "OPEN",
    "donor": {
      "id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "city": "São Paulo",
      "state": "SP"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Listar Doações (endpoint)

**GET** `/api/donations` 🔓

Lista doações com filtros opcionais.

**Query Parameters:**

- `status`: `OPEN`, `IN_PROGRESS`, `PICKED_UP`, `COMPLETED`
- `category`: `FOOD`, `APPLIANCES`, etc.
- `city`: Nome da cidade
- `state`: Sigla do estado (ex: SP)
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máximo: 100)

**Exemplo:** `/api/donations?category=FOOD&city=São Paulo&page=1&limit=20`

**Resposta 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "sequentialId": 1234,
      "title": "Geladeira em bom estado",
      "description": "Geladeira Consul 280L...",
      "status": "OPEN",
      "category": "APPLIANCES",
      "city": "São Paulo",
      "state": "SP",
      "donor": {
        "id": "507f1f77bcf86cd799439011",
        "name": "João Silva"
      },
      "_count": {
        "candidacies": 3
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Obter Doação

**GET** `/api/donations/:id` 🔓

Busca uma doação específica.

**Resposta 200:**

```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "sequentialId": 1234,
    "title": "Geladeira em bom estado",
    "description": "Geladeira Consul 280L...",
    "status": "OPEN",
    "pickupType": "PICK_UP_AT_LOCATION",
    "category": "APPLIANCES",
    "postalCode": "12345-678",
    "street": "Rua das Flores",
    "locationNumber": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "donor": {
      "id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "contactEmail": "joao@example.com",
      "contactPhone": "(11) 98765-4321"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Atualizar Doação

**PATCH** `/api/donations/:id` 🔒

Atualiza uma doação (apenas se status = OPEN).

**Body (campos opcionais):**

```json
{
  "title": "Geladeira Consul 280L",
  "description": "Descrição atualizada"
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Doação atualizada com sucesso",
  "data": { }
}
```

#### Excluir Doação

**DELETE** `/api/donations/:id` 🔒

Exclui uma doação (apenas se status = OPEN).

**Resposta 204:** *(No Content)*

#### Minhas Doações

**GET** `/api/donations/my-donations` 🔒

Lista todas as doações criadas pelo usuário.

**Resposta 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Geladeira em bom estado",
      "status": "OPEN",
      "receiver": null,
      "_count": {
        "candidacies": 3
      }
    }
  ]
}
```

#### Doações Recebidas

**GET** `/api/donations/received` 🔒

Lista doações que o usuário está recebendo ou recebeu.

**Resposta 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "title": "Sofá de 3 lugares",
      "status": "IN_PROGRESS",
      "donor": {
        "id": "507f1f77bcf86cd799439014",
        "name": "Maria Santos"
      },
      "progress": {
        "pickupConfirmedByDonor": true,
        "pickupConfirmedByReceiver": false
      }
    }
  ]
}
```

#### Candidatar-se

**POST** `/api/donations/:id/apply` 🔒

Manifesta interesse em receber uma doação.

**Resposta 201:**

```json
{
  "status": "success",
  "message": "Candidatura realizada com sucesso",
  "data": {
    "id": "507f1f77bcf86cd799439015",
    "donationId": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Listar Candidatos

**GET** `/api/donations/:id/candidates` 🔒

Lista candidatos de uma doação (apenas doador).

**Resposta 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439015",
      "user": {
        "id": "507f1f77bcf86cd799439016",
        "name": "Pedro Costa",
        "age": 30,
        "city": "São Paulo",
        "state": "SP",
        "biography": "Preciso de uma geladeira",
        "_count": {
          "receivedDonations": 2
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Retirar Candidatura

**DELETE** `/api/donations/:id/candidacy` 🔒

Cancela candidatura para uma doação.

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Candidatura retirada com sucesso"
}
```

#### Escolher Receptor

**POST** `/api/donations/:id/choose-receiver` 🔒

Doador escolhe quem vai receber a doação.

**Body:**

```json
{
  "receiverId": "507f1f77bcf86cd799439016"
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Receptor escolhido com sucesso",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "status": "IN_PROGRESS",
    "receiverId": "507f1f77bcf86cd799439016"
  }
}
```

#### Atualizar Progresso

**PATCH** `/api/donations/:id/progress` 🔒

Marca/desmarca checkboxes de confirmação.

**Body:**

```json
{
  "pickupConfirmedByDonor": true
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Progresso atualizado com sucesso",
  "data": { }
}
```

#### Sinalizar Devolução

**POST** `/api/donations/:id/signal-return` 🔒

Receptor sinaliza que quer devolver.

**Body:**

```json
{
  "returnReason": "Item não estava conforme descrito"
}
```

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Devolução sinalizada com sucesso"
}
```

#### Confirmar Devolução

**POST** `/api/donations/:id/confirm-return` 🔒

Doador ou receptor confirma a devolução.

**Resposta 200:**

```json
{
  "status": "success",
  "message": "Devolução confirmada. A doação voltou a estar disponível para candidaturas."
}
```

## 🚨 Tratamento de Erros

Todos os erros seguem o mesmo formato:

```json
{
  "status": "error",
  "message": "Descrição do erro"
}
```

### Códigos de Status HTTP

| Código | Significado | Exemplo |
|--------|-------------|---------|
| 200 | OK | Operação bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 204 | No Content | Deleção bem-sucedida |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Email duplicado, etc |
| 500 | Internal Server Error | Erro no servidor |

## 📄 Licença

Este projeto está sob a licença MIT.

## Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue primeiro para discutir mudanças maiores.

## Suporte

Se você encontrou um bug ou tem alguma sugestão, abra uma [issue no GitHub](https://github.com/seu-usuario/fila-solidaria-backend/issues).

Desenvolvido com ❤️ para conectar pessoas através da solidariedade
