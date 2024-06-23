import { Router } from "express";
import Database from "../config/database.js"
import { getCurso, inscreverEmCurso } from "../controller/curso.js"
import isAuth from "../config/auth.js"
import { converterFormatoData } from "../config/utils.js";

const router = Router();

// GET CURSOS "/cursos"
router.get("/", isAuth, async (req, res) => {
    try {
        const currentUserId = req.user.id

        const data = await Database.curso.findMany({
            where: {
                inicio: {
                    gte: new Date()
                }
            },
            select: {
                nome: true,
                descricao: true,
                inicio: true,
                inscricoes: true,
                usuarios: {
                    where: {
                        id: currentUserId,
                    },
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                nome: 'asc'
            }
        })

        const cursos = await Promise.all(data.map(async (curso) => {
            const { usuarios, inicio, created_at, updated_at, ...rest } = curso;
            const data_inicio = await converterFormatoData(inicio)

            return {
                ...rest,
                inicio: data_inicio,
                inscrito: usuarios.length > 0,
            }
        }));

        res.status(200).json({
            data: cursos
        });
    } catch (err) {
        res.status(500).json({ message: err.message })
        return
    }
});

// FAZER INSCRIÇÃO "/cursos/:idCurso"
router.post("/:idCurso", isAuth, async (req, res) => {
    try {
        const searchedCursoId = parseInt(req.params.idCurso)
        const currentUserId = req.user.id

        const inscricao = await inscreverEmCurso(currentUserId, searchedCursoId)

        res.status(200).json({ message: "Inscrição realizada!" })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

// CANCELAR INSCRIÇÃO "/cursos/:idCurso"
router.patch("/:idCurso", isAuth, async (req, res) => {
    try {
        const searchedCursoId = parseInt(req.params.idCurso)
        const currentUserId = req.user.id

        const cancelamento = await cancelarInscricaoEmCurso(currentUserId, searchedCursoId)

        res.status(200).json({ message: "Inscrição cancelada." })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

// FAZER INSCRIÇÃO "/cursos/:idCurso"
// router.post("/:idCurso", isAuth, async (req, res) => {
//     try {
//         const searchedCursoId = parseInt(req.params.idCurso)
//         const currentUserId = req.user.id

//         const curso = await getCurso({ id: searchedCursoId })

//         if (!curso) {
//             res.status(404).json({ message: "O curso procurado não existe." })
//             return
//         }

//         const inscricoesAtuais = await Database.curso.findUnique({
//             where: {
//                 id: parseInt(searchedCursoId),
//             },
//             select: {
//                 usuarios: {
//                     where: {
//                         id: parseInt(currentUserId),
//                     },
//                     select: {
//                         id: true,
//                     },
//                 },
//             },
//         });

//         if (inscricoesAtuais.usuarios.length > 0) {
//             const result = await alterarInscricao(currentUserId, searchedCursoId, "disconnect", "decrement")
//             res.status(404).json({ message: "Inscrição cancelada." })
//             return
//         }

//         const result = await alterarInscricao(currentUserId, searchedCursoId, "connect", "increment")

//         res.status(200).json({
//             message: "Inscrição realizada com sucesso!",
//             usuario: result.updatedUsuario,
//             curso: result.updatedCurso,
//         });

//     } catch (error) {
//         console.error(error)
//         res.status(400).json({ message: error.message })
//     }
// })

// CADASTRAR CURSOS "/cursos"
// router.post("/", async (req, res) => {
//     try {
//         const data = req.body;

//         if (!data.nome) {
//             res.status(400).json({ message: "Insira um nome." })
//             return
//         }

//         const nomeExistente = await Database.curso.findMany({
//             where: {
//                 nome: data.nome
//             }
//         })

//         if (nomeExistente.length) {
//             res.status(400).json({ message: "O username inserido já está sendo utilizado." })
//             return
//         }

//         const novoCurso = await createCurso({
//             nome: data.nome,
//             descricao: data.descricao,
//             capa: data.capa,
//             inscricoes: data.inscricoes,
//             inicio: data.inicio
//         });

//         res.status(200).json({ message: "Curso cadastrado com sucesso!", data: novoCurso })
//         return
//     } catch (error) {
//         res.status(400).json({ message: error.message })
//         return
//     }
// })

export default router