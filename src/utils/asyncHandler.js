// the purpose of this file is to handle the async errors in the express routes and middlewares
// so that we don't have to write try catch block in every async function


// By using Try and Catch 
// const asyncHandler = (fn) => async (req , res , next ) => {
//     try {
//         await fn(req, res , next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false , 
//             message : error.message
//         })
        
//     }
// }


// by using Promises 

const asyncHandler = (requestHandler) =>
    (req, res, next) =>
        Promise.resolve(requestHandler(req, res, next)).catch(next);


export default asyncHandler ;