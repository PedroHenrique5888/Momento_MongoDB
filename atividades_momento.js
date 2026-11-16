// Atividades MongoDB - Momento
// banco: momento

use("momento");

// 1.1 me incluindo no depto de Tecnologia
db.funcionarios.insertOne({
  _id: 217,
  primeiro_nome: "Pedro",
  sobrenome: "Henrique",
  email: "pedro.proa@senac.br",
  senha: "Senha123",
  telefone: null,
  data_contratacao: ISODate("2026-11-16"),
  cargo_id: 9,
  salario: NumberDecimal("5000.00"),
  gerente_id: 103,
  departamento_id: 6,
  dependentes: []
});

// 1.2 total de funcionários
db.funcionarios.countDocuments();

// 1.3 funcionários de Tecnologia
db.funcionarios.countDocuments({ departamento_id: 6 });

// 1.4 lista e quantidade de departamentos
db.departamentos.find({}, { nome: 1 });
db.departamentos.countDocuments();

// 1.5 escritórios e países
db.escritorios.countDocuments();
db.escritorios.aggregate([
  { $lookup: { from: "paises", localField: "pais_id", foreignField: "_id", as: "pais" } },
  { $unwind: "$pais" },
  { $group: { _id: "$pais.nome", escritorios: { $sum: 1 } } }
]);

// 2.1 funcionários de Vendas
db.funcionarios.countDocuments({ departamento_id: 8 });

// 2.2 custo total de salários de Vendas
db.funcionarios.aggregate([
  { $match: { departamento_id: 8 } },
  { $group: { _id: null, total: { $sum: "$salario" } } }
]);

// 2.3 média salarial sem CEO (4), CMO (10) e CFO (7)
db.funcionarios.aggregate([
  { $match: { cargo_id: { $nin: [4, 10, 7] } } },
  { $group: { _id: null, media: { $avg: "$salario" } } }
]);

// 2.4 média de Tecnologia
db.funcionarios.aggregate([
  { $match: { departamento_id: 6 } },
  { $group: { _id: null, media: { $avg: "$salario" } } }
]);

// 2.5 depto com maior média
db.funcionarios.aggregate([
  { $group: { _id: "$departamento_id", media: { $avg: "$salario" } } },
  { $sort: { media: -1 } },
  { $limit: 1 },
  { $lookup: { from: "departamentos", localField: "_id", foreignField: "_id", as: "dep" } }
]);

// 2.6 depto com menos funcionários
db.funcionarios.aggregate([
  { $group: { _id: "$departamento_id", total: { $sum: 1 } } },
  { $sort: { total: 1 } },
  { $limit: 1 },
  { $lookup: { from: "departamentos", localField: "_id", foreignField: "_id", as: "dep" } }
]);

// 3.1 com cônjuge
db.funcionarios.countDocuments({ "dependentes.relacionamento": "Cônjuge" });

// 3.2 com filhos
db.funcionarios.countDocuments({ "dependentes.relacionamento": "Filha(o)" });

// 3.3 mais antigo
db.funcionarios.find().sort({ data_contratacao: 1 }).limit(1);

// 3.4 mais novo
db.funcionarios.find().sort({ data_contratacao: -1 }).limit(1);

// 3.5 top 5 mais antigos
db.funcionarios.find({}, { primeiro_nome: 1, sobrenome: 1, data_contratacao: 1 })
  .sort({ data_contratacao: 1 }).limit(5);

// 3.6 contratados nos anos 90
db.funcionarios.countDocuments({
  data_contratacao: { $gte: ISODate("1990-01-01"), $lt: ISODate("2000-01-01") }
});

// 3.7 média salarial por ano de contratação
db.funcionarios.aggregate([
  { $group: { _id: { $year: "$data_contratacao" }, media: { $avg: "$salario" } } },
  { $sort: { _id: 1 } }
]);

// 4.1 custo de suprimentos por escritório
db.escritorios.aggregate([
  { $project: { nome: 1, custoTotal: { $sum: "$suprimentos.custo" } } },
  { $sort: { custoTotal: -1 } }
]);

// 4.2 escritório com mais tipos de suprimento
db.escritorios.aggregate([
  { $project: { nome: 1, tipos: { $size: { $setUnion: ["$suprimentos.nome", []] } } } },
  { $sort: { tipos: -1 } },
  { $limit: 1 }
]);

// 4.3 suprimento mais caro
db.escritorios.aggregate([
  { $unwind: "$suprimentos" },
  { $sort: { "suprimentos.custo": -1 } },
  { $limit: 1 }
]);

// 4.4 valor total do inventário (quantidade x custo, como o enunciado pede)
db.escritorios.aggregate([
  { $unwind: "$suprimentos" },
  { $group: { _id: null, total: { $sum: { $multiply: ["$suprimentos.quantidade", "$suprimentos.custo"] } } } }
]);

// 5.1 produtos vendidos
db.vendas.aggregate([
  { $group: { _id: "$produto_id" } },
  { $lookup: { from: "produtos", localField: "_id", foreignField: "_id", as: "produto" } },
  { $unwind: "$produto" },
  { $project: { _id: 0, nome: "$produto.nome" } }
]);

// 5.2 mais vendido
db.vendas.aggregate([
  { $group: { _id: "$produto_id", qtd: { $sum: "$quantidade" } } },
  { $sort: { qtd: -1 } },
  { $limit: 1 },
  { $lookup: { from: "produtos", localField: "_id", foreignField: "_id", as: "produto" } }
]);

// 5.3 menos vendido
db.vendas.aggregate([
  { $group: { _id: "$produto_id", qtd: { $sum: "$quantidade" } } },
  { $sort: { qtd: 1 } },
  { $limit: 1 },
  { $lookup: { from: "produtos", localField: "_id", foreignField: "_id", as: "produto" } }
]);

// 5.4 produto que gerou mais receita
db.vendas.aggregate([
  { $lookup: { from: "produtos", localField: "produto_id", foreignField: "_id", as: "produto" } },
  { $unwind: "$produto" },
  { $group: {
      _id: "$produto.nome",
      receita: { $sum: { $multiply: ["$quantidade", "$produto.preco_unitario"] } }
  } },
  { $sort: { receita: -1 } },
  { $limit: 1 }
]);

// 5.5 produto mais caro
db.produtos.find().sort({ preco_unitario: -1 }).limit(1);

// 5.6 faturamento total
db.vendas.aggregate([
  { $lookup: { from: "produtos", localField: "produto_id", foreignField: "_id", as: "produto" } },
  { $unwind: "$produto" },
  { $group: { _id: null, faturamento: { $sum: { $multiply: ["$quantidade", "$produto.preco_unitario"] } } } }
]);

// 5.7 vendas em junho de 2023
db.vendas.countDocuments({
  data_venda: { $gte: ISODate("2023-06-01"), $lt: ISODate("2023-07-01") }
});

// 5.8 vendedor com mais vendas
db.vendas.aggregate([
  { $group: { _id: "$funcionario_id", total: { $sum: 1 } } },
  { $sort: { total: -1 } },
  { $limit: 1 },
  { $lookup: { from: "funcionarios", localField: "_id", foreignField: "_id", as: "func" } }
]);

// 5.9 vendedor com mais receita
db.vendas.aggregate([
  { $lookup: { from: "produtos", localField: "produto_id", foreignField: "_id", as: "produto" } },
  { $unwind: "$produto" },
  { $group: {
      _id: "$funcionario_id",
      receita: { $sum: { $multiply: ["$quantidade", "$produto.preco_unitario"] } }
  } },
  { $sort: { receita: -1 } },
  { $limit: 1 },
  { $lookup: { from: "funcionarios", localField: "_id", foreignField: "_id", as: "func" } }
]);

// 6.1 novo departamento no Wayne Offices
db.departamentos.insertOne({ _id: 14, nome: "Inovações", escritorio_id: 1400 });

// 6.2 passando 2 funcionários de Tecnologia para Inovações
var doisFuncs = db.funcionarios.find({ departamento_id: 6 }).limit(2).toArray().map(f => f._id);
db.funcionarios.updateMany({ _id: { $in: doisFuncs } }, { $set: { departamento_id: 14 } });

// 6.3 aumento de 10% em Tecnologia
db.funcionarios.updateMany(
  { departamento_id: 6 },
  [{ $set: { salario: { $round: [{ $multiply: ["$salario", NumberDecimal("1.10")] }, 2] } } }]
);

// 6.4 Bruce Ernst: o cargo não existia, então criei antes
db.cargos.insertOne({
  _id: 22, nome: "Senior Web Developer",
  salario_minimo: NumberDecimal("5000.00"), salario_maximo: NumberDecimal("12000.00")
});
db.funcionarios.updateOne(
  { primeiro_nome: "Bruce", sobrenome: "Ernst" },
  { $set: { cargo_id: 22, salario: NumberDecimal("5000.00") } }
);

// 6.5 headsets no Wayne Offices
db.escritorios.updateOne(
  { nome: "Wayne Offices" },
  { $push: { suprimentos: { _id: 49, nome: "Headsets", quantidade: 15, custo: NumberDecimal("150.00") } } }
);

// 6.6 contratados antes de 1990: primeiro só o find
db.funcionarios.find({ data_contratacao: { $lt: ISODate("1990-01-01") } });
db.funcionarios.countDocuments({ data_contratacao: { $lt: ISODate("1990-01-01") } }); // dá 3 (100, 101 e 200)
// cuidado: o 100 e o 101 são gerentes de outros funcionários, apagar deixa gerente_id apontando pra ninguém
// db.funcionarios.deleteMany({ data_contratacao: { $lt: ISODate("1990-01-01") } });

// 7.1 relatório por departamento
db.funcionarios.aggregate([
  { $group: {
      _id: "$departamento_id",
      funcionarios: { $sum: 1 },
      salarioTotal: { $sum: "$salario" },
      mediaSalarial: { $avg: "$salario" }
  } },
  { $lookup: { from: "departamentos", localField: "_id", foreignField: "_id", as: "dep" } },
  { $unwind: "$dep" },
  { $project: { _id: 0, departamento: "$dep.nome", funcionarios: 1, salarioTotal: 1, mediaSalarial: 1 } }
]);

// 7.2 3 cargos mais comuns
db.funcionarios.aggregate([
  { $group: { _id: "$cargo_id", total: { $sum: 1 } } },
  { $sort: { total: -1 } },
  { $limit: 3 },
  { $lookup: { from: "cargos", localField: "_id", foreignField: "_id", as: "cargo" } },
  { $unwind: "$cargo" },
  { $project: { _id: 0, cargo: "$cargo.nome", total: 1 } }
]);

// 7.3 quem ganha acima da média do próprio departamento
db.funcionarios.aggregate([
  { $setWindowFields: {
      partitionBy: "$departamento_id",
      output: { mediaDepto: { $avg: "$salario" } }
  } },
  { $match: { $expr: { $gt: ["$salario", "$mediaDepto"] } } },
  { $project: { primeiro_nome: 1, sobrenome: 1, salario: 1, mediaDepto: 1 } }
]);

// 7.4 contratações por ano
db.funcionarios.aggregate([
  { $group: { _id: { $year: "$data_contratacao" }, contratados: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);

// 7.5 ranking de vendedores
db.vendas.aggregate([
  { $lookup: { from: "produtos", localField: "produto_id", foreignField: "_id", as: "produto" } },
  { $unwind: "$produto" },
  { $group: {
      _id: "$funcionario_id",
      vendas: { $sum: 1 },
      receita: { $sum: { $multiply: ["$quantidade", "$produto.preco_unitario"] } }
  } },
  { $lookup: { from: "funcionarios", localField: "_id", foreignField: "_id", as: "func" } },
  { $unwind: "$func" },
  { $project: { _id: 0, vendedor: { $concat: ["$func.primeiro_nome", " ", "$func.sobrenome"] }, vendas: 1, receita: 1 } },
  { $sort: { receita: -1 } }
]);

// 7.6 produtos vendidos por um vendedor só
db.vendas.aggregate([
  { $group: { _id: "$produto_id", vendedores: { $addToSet: "$funcionario_id" } } },
  { $match: { $expr: { $eq: [{ $size: "$vendedores" }, 1] } } },
  { $lookup: { from: "produtos", localField: "_id", foreignField: "_id", as: "produto" } }
]);

// 8.1 funcionários de Vendas com dependentes
db.funcionarios.find({ departamento_id: 8, "dependentes.0": { $exists: true } });
db.funcionarios.find({ departamento_id: 8, dependentes: { $ne: [] } });
db.funcionarios.find({ departamento_id: 8, $expr: { $gt: [{ $size: "$dependentes" }, 0] } });
db.funcionarios.find({
  departamento_id: 8,
  $or: [{ "dependentes.relacionamento": "Cônjuge" }, { "dependentes.relacionamento": "Filha(o)" }]
});

// 8.2 no modelo novo o funcionário não tem escritório próprio, ele vem do departamento,
// então não tem como dar inconsistência. O que dá pra checar é se todo departamento tem escritório válido:
db.departamentos.aggregate([
  { $lookup: { from: "escritorios", localField: "escritorio_id", foreignField: "_id", as: "esc" } },
  { $match: { esc: { $size: 0 } } }
]);

// 8.3 relatório por escritório
db.escritorios.aggregate([
  { $lookup: { from: "paises", localField: "pais_id", foreignField: "_id", as: "pais" } },
  { $lookup: { from: "departamentos", localField: "_id", foreignField: "escritorio_id", as: "deps" } },
  { $lookup: { from: "funcionarios", localField: "deps._id", foreignField: "departamento_id", as: "funcs" } },
  { $project: {
      _id: 0,
      escritorio: "$nome",
      pais: { $first: "$pais.nome" },
      departamentos: { $size: "$deps" },
      funcionarios: { $size: "$funcs" },
      custoSalarios: { $sum: "$funcs.salario" },
      custoSuprimentos: { $sum: "$suprimentos.custo" }
  } }
]);

// 8.4 departamento mais equilibrado (menor diferença entre maior e menor salário)
// obs: depto com 1 funcionário só dá diferença 0
db.funcionarios.aggregate([
  { $group: { _id: "$departamento_id", maior: { $max: "$salario" }, menor: { $min: "$salario" }, n: { $sum: 1 } } },
  { $project: { n: 1, diferenca: { $subtract: ["$maior", "$menor"] } } },
  { $sort: { diferenca: 1 } },
  { $limit: 3 },
  { $lookup: { from: "departamentos", localField: "_id", foreignField: "_id", as: "dep" } }
]);

// 8.5 produtos com "Uniforme"
db.produtos.find({ nome: /Uniforme/ });

// 8.6 vendas do 2º trimestre de 2023
db.vendas.find({ data_venda: { $gte: ISODate("2023-04-01"), $lt: ISODate("2023-07-01") } });

// 9.1 salário entre 6000 e 10000
db.funcionarios.find({ salario: { $gte: NumberDecimal("6000.00"), $lte: NumberDecimal("10000.00") } });
db.funcionarios.find({ $and: [
  { salario: { $gte: NumberDecimal("6000.00") } },
  { salario: { $lte: NumberDecimal("10000.00") } }
] });
db.funcionarios.aggregate([
  { $match: { $expr: { $and: [
    { $gte: ["$salario", NumberDecimal("6000.00")] },
    { $lte: ["$salario", NumberDecimal("10000.00")] }
  ] } } }
]);

// 9.2 A opção A é a mais eficiente. O filtro roda no servidor e pode usar o índice de departamento_id.
// A B não existe no mongosh (cursor não tem .filter) e, se filtrasse no cliente,
// traria todo mundo com salário > 7000 pela rede pra filtrar depois.
db.funcionarios.find({ departamento_id: 8, salario: { $gt: NumberDecimal("7000.00") } }).explain("executionStats");

// 9.3 sem email ou telefone (email é obrigatório, então na prática só o telefone falta)
db.funcionarios.find({ $or: [{ email: null }, { email: "" }, { telefone: null }, { telefone: "" }] });

// 9.4 funcionários solitários
db.funcionarios.aggregate([
  { $group: { _id: { dep: "$departamento_id", cargo: "$cargo_id" }, n: { $sum: 1 }, func: { $first: "$$ROOT" } } },
  { $match: { n: 1 } },
  { $project: { _id: 0, nome: "$func.primeiro_nome", sobrenome: "$func.sobrenome", dep: "$_id.dep", cargo: "$_id.cargo" } }
]);

// 9.5 relatório por país
db.paises.aggregate([
  { $lookup: { from: "escritorios", localField: "_id", foreignField: "pais_id", as: "esc" } },
  { $match: { "esc.0": { $exists: true } } },
  { $lookup: { from: "departamentos", localField: "esc._id", foreignField: "escritorio_id", as: "deps" } },
  { $lookup: { from: "funcionarios", localField: "deps._id", foreignField: "departamento_id", as: "funcs" } },
  { $project: {
      _id: 0,
      pais: "$nome",
      escritorios: { $size: "$esc" },
      departamentos: { $size: "$deps" },
      funcionarios: { $size: "$funcs" },
      receitaTotal: { $add: [
        { $sum: "$funcs.salario" },
        { $sum: { $map: { input: "$esc", as: "e", in: { $sum: "$$e.suprimentos.custo" } } } }
      ] }
  } }
]);

// 10.1 escritório no Brasil
db.escritorios.insertOne({
  _id: 4000, nome: "Momento Brasil", endereco: "Av. Paulista, 1000", cep: "01310-100",
  cidade: "São Paulo", estado_provincia: "São Paulo", pais_id: "BR",
  suprimentos: [
    { _id: 50, nome: "Computers", quantidade: 10, custo: NumberDecimal("50000.00") },
    { _id: 51, nome: "Impressoras", quantidade: 2, custo: NumberDecimal("500.00") },
    { _id: 52, nome: "Notebook", quantidade: 30, custo: NumberDecimal("600.00") }
  ]
});

// 10.2 departamento Operações LATAM
db.departamentos.insertOne({ _id: 15, nome: "Operações LATAM", escritorio_id: 4000 });

// 10.3 5 funcionários
db.funcionarios.updateOne({ _id: 217 }, { $set: { departamento_id: 15 } });
db.funcionarios.insertMany([
  { _id: 218, primeiro_nome: "Colega", sobrenome: "Um", email: "colega.um@momento.org", senha: "Exercicio123!", telefone: null,
    data_contratacao: ISODate("2026-11-16"), cargo_id: 11, salario: NumberDecimal("5000.00"), gerente_id: 100, departamento_id: 15, dependentes: [] },
  { _id: 219, primeiro_nome: "Colega", sobrenome: "Dois", email: "colega.dois@momento.org", senha: "Exercicio123!", telefone: null,
    data_contratacao: ISODate("2026-11-16"), cargo_id: 11, salario: NumberDecimal("5000.00"), gerente_id: 100, departamento_id: 15, dependentes: [] },
  { _id: 220, primeiro_nome: "Colega", sobrenome: "Tres", email: "colega.tres@momento.org", senha: "Exercicio123!", telefone: null,
    data_contratacao: ISODate("2026-11-16"), cargo_id: 11, salario: NumberDecimal("5000.00"), gerente_id: 100, departamento_id: 15, dependentes: [] },
  { _id: 221, primeiro_nome: "Colega", sobrenome: "Quatro", email: "colega.quatro@momento.org", senha: "Exercicio123!", telefone: null,
    data_contratacao: ISODate("2026-11-16"), cargo_id: 11, salario: NumberDecimal("5000.00"), gerente_id: 100, departamento_id: 15, dependentes: [] }
]);

// 10.4 3 escritórios com maior custo de suprimentos
db.escritorios.aggregate([
  { $project: { nome: 1, custoTotal: { $sum: "$suprimentos.custo" } } },
  { $sort: { custoTotal: -1 } },
  { $limit: 3 }
]);

// 10.5 suprimentos com mais de 50 unidades
db.escritorios.aggregate([
  { $unwind: "$suprimentos" },
  { $match: { "suprimentos.quantidade": { $gt: 50 } } },
  { $project: { _id: 0, escritorio: "$nome", suprimento: "$suprimentos.nome", quantidade: "$suprimentos.quantidade" } }
]);

// 10.6 economia com corte de 20% nos salários acima de 15000
db.funcionarios.aggregate([
  { $match: { salario: { $gt: NumberDecimal("15000.00") } } },
  { $group: { _id: null, economia: { $sum: { $multiply: ["$salario", NumberDecimal("0.20")] } } } }
]);

// 10.7 vendas sem vendedor
db.vendas.find({ $or: [{ funcionario_id: null }, { funcionario_id: { $exists: false } }] });

// 10.8 vendedores das vendas que não existem em funcionarios
db.vendas.aggregate([
  { $lookup: { from: "funcionarios", localField: "funcionario_id", foreignField: "_id", as: "func" } },
  { $match: { func: { $size: 0 } } }
]);

// 10.9 não dá pra fazer: a venda não guarda o preço, só produto_id e quantidade.
// O preço vem sempre do catálogo, então não existe variação entre transações.

// 10.10 dashboard em uma query só
db.funcionarios.aggregate([
  { $group: { _id: null, totalFuncionarios: { $sum: 1 }, custoSalarios: { $sum: "$salario" } } },
  { $lookup: { from: "departamentos", pipeline: [{ $count: "n" }], as: "dep" } },
  { $lookup: { from: "escritorios", pipeline: [{ $count: "n" }], as: "esc" } },
  { $lookup: {
      from: "vendas",
      as: "vendas",
      pipeline: [
        { $lookup: { from: "produtos", localField: "produto_id", foreignField: "_id", as: "p" } },
        { $unwind: "$p" },
        { $group: {
            _id: "$p._id", nome: { $first: "$p.nome" }, qtd: { $sum: "$quantidade" },
            receita: { $sum: { $multiply: ["$quantidade", "$p.preco_unitario"] } }
        } },
        { $group: {
            _id: null,
            receitaTotal: { $sum: "$receita" },
            maisVendido: { $top: { sortBy: { qtd: -1 }, output: { nome: "$nome", quantidade: "$qtd" } } }
        } }
      ]
  } },
  { $project: {
      _id: 0, totalFuncionarios: 1, custoSalarios: 1,
      departamentos: { $first: "$dep.n" },
      escritorios: { $first: "$esc.n" },
      receitaVendas: { $first: "$vendas.receitaTotal" },
      produtoMaisVendido: { $first: "$vendas.maisVendido" }
  } }
]);
