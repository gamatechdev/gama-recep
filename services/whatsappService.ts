/**
 * whatsappService.ts
 * ------------------
 * Serviço responsável por TODA a comunicação com a API da Z-API (WhatsApp Business).
 * Cada função encapsula um tipo específico de envio, mantendo o ChatWindow
 * livre de lógica de rede e constantes de credenciais.
 *
 * Princípio: Single Responsibility — este módulo só sabe como enviar mensagens,
 * não sabe nada sobre estado React ou Supabase.
 */

// ─── Constantes de Configuração da Z-API ─────────────────────────────────────
// Centralizadas aqui para facilitar troca de instância/token sem varrer o código.
const ZAPI_BASE_URL =
    'https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85';

// Client-Token de segurança exigido pelo header de todas as requisições da Z-API
const ZAPI_CLIENT_TOKEN = 'F53f53bad10a9494f92d5e33804220a26S';

// Headers padrão para todas as chamadas JSON
const DEFAULT_HEADERS: HeadersInit = {
    'Content-Type': 'application/json',
    'Client-Token': ZAPI_CLIENT_TOKEN,
};

// ─── Helper Interno ───────────────────────────────────────────────────────────

/**
 * Função auxiliar privada que executa um fetch POST para a Z-API.
 * Lança um erro legível com o body da resposta em caso de falha HTTP.
 *
 * @param endpoint - Caminho após a URL base (ex: '/send-text')
 * @param body     - Objeto que será serializado como JSON no body da requisição
 */
async function zApiPost(endpoint: string, body: object): Promise<void> {
    // Monta a URL completa concatenando a base com o endpoint específico
    const response = await fetch(`${ZAPI_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(body),
    });

    // Verifica se a resposta HTTP foi bem-sucedida (status 2xx)
    if (!response.ok) {
        // Lê o texto de erro retornado pela API para logar e relançar
        const errorText = await response.text();
        console.error(`[whatsappService] Erro na Z-API (${endpoint}):`, errorText);
        throw new Error(`Z-API Error (${endpoint}): ${errorText}`);
    }
}

// ─── Frente 1: Funções de Envio Z-API ────────────────────────────────────────

/**
 * Envia uma mensagem de texto simples pelo WhatsApp.
 *
 * @param phone   - Número do destinatário no formato internacional (ex: '5531999999999')
 * @param message - Texto da mensagem a ser enviada (suporta formatação *negrito*)
 */
export async function sendWhatsAppText(phone: string, message: string): Promise<void> {
    await zApiPost('/send-text', { phone, message });
}

/**
 * Envia uma mensagem de texto com edição de uma mensagem existente.
 * Usado para a funcionalidade de editar mensagem no chat.
 *
 * @param phone          - Número do destinatário
 * @param message        - Novo texto da mensagem
 * @param editMessageId  - ID Z-API da mensagem original a ser editada
 */
export async function sendWhatsAppEditText(
    phone: string,
    message: string,
    editMessageId: string
): Promise<void> {
    await zApiPost('/send-text', { phone, message, editMessageId });
}

/**
 * Envia uma mensagem de texto como resposta a outra mensagem existente.
 * A Z-API exibe um "reply" visual na conversa do WhatsApp.
 *
 * @param phone          - Número do destinatário
 * @param message        - Texto da resposta
 * @param messageId      - ID Z-API da mensagem original que está sendo respondida
 */
export async function sendWhatsAppReplyText(
    phone: string,
    message: string,
    messageId: string
): Promise<void> {
    await zApiPost('/send-text', { phone, message, messageId });
}

/**
 * Exclui uma mensagem existente do WhatsApp (somente para o remetente).
 * Usa método DELETE com endpoint diferente dos demais.
 *
 * @param phone     - Número do destinatário associado à mensagem
 * @param messageId - ID Z-API da mensagem a ser excluída
 */
export async function deleteWhatsAppMessage(
    phone: string,
    messageId: string
): Promise<void> {
    // Esta chamada usa DELETE, não POST, portanto não pode usar o helper zApiPost
    const deleteUrl = `${ZAPI_BASE_URL}/messages?messageId=${messageId}&Phone=${phone}&owner=true`;

    const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Client-Token': ZAPI_CLIENT_TOKEN },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[whatsappService] Erro ao deletar mensagem:', errorText);
        throw new Error(`Falha na API de deleção: ${errorText}`);
    }
}

/**
 * Envia um arquivo de áudio gravado pelo usuário via WhatsApp.
 * O áudio deve estar hospedado publicamente (ex: Supabase Storage).
 *
 * @param phone    - Número do destinatário
 * @param audioUrl - URL pública do arquivo de áudio (.webm ou .ogg)
 */
export async function sendWhatsAppAudio(phone: string, audioUrl: string): Promise<void> {
    await zApiPost('/send-audio', {
        phone,
        audio: audioUrl,
        viewOnce: false,   // O áudio pode ser ouvido mais de uma vez
        waveform: true,    // Exibe a forma de onda animada no WhatsApp
    });
}

/**
 * Envia uma imagem com legenda opcional pelo WhatsApp.
 * A imagem deve estar hospedada publicamente.
 *
 * @param phone    - Número do destinatário
 * @param imageUrl - URL pública da imagem
 * @param caption  - Legenda opcional exibida abaixo da imagem
 */
export async function sendWhatsAppImage(
    phone: string,
    imageUrl: string,
    caption: string = ''
): Promise<void> {
    await zApiPost('/send-image', {
        phone,
        image: imageUrl,
        caption,
        viewOnce: false, // A imagem pode ser visualizada mais de uma vez
    });
}

/**
 * Envia um documento (PDF, DOCX, etc.) pelo WhatsApp.
 * O endpoint da Z-API depende da extensão do arquivo.
 *
 * @param phone       - Número do destinatário
 * @param documentUrl - URL pública do documento no Supabase Storage
 * @param fileName    - Nome que o arquivo aparecerá para o destinatário
 * @param extension   - Extensão do arquivo (ex: 'pdf', 'docx') — usada no endpoint
 */
export async function sendWhatsAppDocument(
    phone: string,
    documentUrl: string,
    fileName: string,
    extension: string
): Promise<void> {
    // O endpoint da Z-API para documentos inclui a extensão do arquivo na URL
    await zApiPost(`/send-document/${extension}`, {
        phone,
        document: documentUrl,
        fileName,
    });
}

/**
 * Envia a chave PIX da Gama Center para o destinatário via botão interativo do WhatsApp.
 * A Z-API renderiza um card especial de PIX na conversa.
 *
 * @param phone - Número do destinatário
 */
export async function sendWhatsAppPix(phone: string): Promise<void> {
    await zApiPost('/send-button-pix', {
        phone,
        pixKey: '52620502000119', // Chave CNPJ da Gama Center
        type: 'EVP',             // Tipo EVP = chave aleatória / CNPJ
    });
}

/**
 * Envia um contato da agenda do sistema para outro usuário do WhatsApp.
 * A Z-API renderiza um card de contato clicável na conversa.
 *
 * @param phone        - Número do destinatário
 * @param contactName  - Nome de exibição do contato a ser compartilhado
 * @param contactPhone - Telefone do contato a ser compartilhado
 */
export async function sendWhatsAppContact(
    phone: string,
    contactName: string,
    contactPhone: string
): Promise<void> {
    await zApiPost('/send-contact', {
        phone,
        contactName,
        contactPhone,
    });
}
