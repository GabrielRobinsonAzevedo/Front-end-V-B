drop table if exists mensagem_atendimento cascade;
drop table if exists pedido_item cascade;
drop table if exists pedido cascade;
drop table if exists produto cascade;
drop table if exists administrador cascade;
drop table if exists cliente cascade;

create table cliente (
    id serial primary key,
    email varchar(150) unique not null,
    cpf_cnpj varchar(18) not null,
    senha_hash varchar(255) null,
    status_conta varchar(100) not null default 'Pendente',
    data_criacao timestamp not null default current_timestamp
);

create table produto (
    id serial primary key,
    titulo varchar(100) not null,
    descricao text,
    categoria varchar(100) not null,
    preco decimal(10, 2) not null,
    status_ativo boolean not null default true
);

create table pedido (
    id serial primary key,
    id_cliente int not null references cliente(id) on delete cascade,
    data_pedido timestamp not null default current_timestamp,
    valor_total decimal(10, 2) not null,
    status_pagamento varchar(100) not null default 'Aguardando Pagamento',
    status_servico varchar(100) not null default 'Pendente'
);

create table pedido_item (
    id serial primary key,
    id_pedido int not null references pedido(id) on delete cascade,
    id_produto int not null references produto(id) on delete restrict,
    quantidade int not null check (quantidade > 0),
    preco_unitario decimal(10, 2) not null
);

create table mensagem_atendimento (
    id serial primary key,
    id_pedido int not null references pedido(id) on delete cascade,
    id_remetente int not null,
    remetente_tipo varchar(100) not null,
    texto text not null,
    url_anexo varchar(255) null,
    data_envio timestamp not null default current_timestamp
);

create table administrador (
    id serial primary key,
    nome varchar(100) not null,
    email varchar(150) unique not null,
    senha_hash varchar(255) not null
);

create index idx_msg_pedido on mensagem_atendimento(id_pedido);
create index idx_msg_remetente on mensagem_atendimento(id_remetente, remetente_tipo);
create index idx_pedido_cliente on pedido(id_cliente);
create index idx_pedido_item_pedido on pedido_item(id_pedido);

insert into produto (id, titulo, descricao, categoria, preco, status_ativo) values
(1, 'Básico', 'Gerenciamento de 1 conta, 6 posts por mês, 6 artes/banners inclusos, Suporte via painel, Edição de vídeos não inclusa', 'Mensal', 299.00, true),
(2, 'Pro (Mais Vendido)', 'Gerenciamento de até 3 contas, 20 posts por mês, 16 artes/banners inclusos, 4 edições de vídeos curtos, Suporte prioritário via painel', 'Mensal', 799.00, true),
(3, 'Premium', 'Gerenciamento de até 5 contas, 30 posts por mês (Presença diária), 20 artes/banners inclusos, 10 edições de vídeos curtos, Suporte VIP com gerente de contas', 'Mensal', 1499.00, true),
(4, 'Pacote de Banners', 'Entrega em até 3 dias úteis, PNG e JPEG de alta qualidade, Até 2 revisões inclusas', 'Avulso', 49.90, true),
(5, 'Edição de Vídeo de Até 1 minuto', 'Entrega em até 4 dias úteis, Formato: MP4 (Vertical 9:16), Incluso busca de músicas em alta', 'Avulso', 89.90, true),
(6, 'Criação de logotipo Profissional', 'Envio dos arquivos editáveis (Vetor/AI/PDF), Manual básico de aplicação da marca, Prazo: 10 dias úteis', 'Avulso', 350.00, true);

alter sequence produto_id_seq restart with 7;

insert into administrador (nome, email, senha_hash) values
('Admin Conecta', 'admin@conecta.com', '$2a$10$W8JT8borLujT3SxgtuIoIuR0h12QI0WGgGCYZ3Mu0QukbMyd27wZm');

insert into cliente (email, cpf_cnpj, senha_hash, status_conta) values
('teste@conecta.com', '123.456.789-00', '$2a$10$W8JT8borLujT3SxgtuIoIuR0h12QI0WGgGCYZ3Mu0QukbMyd27wZm', 'Ativo');
