import { getConnection, executeQuery, endConnection } from "../services/databaseService.js";
import getAuthorId from "../utils/getAuthorId.js";

// 댓글 목록 함수
async function getCommentList(req, res) {
  req.session.commentLiked = req.session.commentLiked || [];
  const pageNum = req.query.pageNum;
  const connection = await getConnection();

  // 잘못된 pageNum 에러처리
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ message: "잘못된 페이지 번호입니다." });
  }

  const totalCommentQuery = `
    SELECT COUNT(*) AS cnt
    FROM comment
    WHERE post_id = ?`;
  const query = `
    SELECT id, user_id, username, content, DATE_FORMAT(creation_date, '%Y-%m-%d %H:%i:%s') AS creation_date, like_count
    FROM comment
    WHERE post_id = ?
    ORDER BY id DESC
    LIMIT 5 OFFSET ?`;

  try {
    const [totalCommentCount] = await executeQuery(connection, totalCommentQuery, [req.params.postID]);
    const totalpageCount = Math.ceil(totalCommentCount[0].cnt / 5) || 1;

    // //달린 댓글이 없는 경우
    // if (!totalpageCount) {
    //   res.status(200).json({
    //     totalpageCount: 1,
    //     data: [],
    //   });
    //   return;
    // }

    if (pageNum > totalpageCount) throw new Error("잘못된 페이지 번호입니다.");

    const [rows] = await executeQuery(connection, query, [req.params.postID, (pageNum - 1) * 5]);
    const data = [];

    rows.forEach((row) => {
      const id = row.id;
      const userId = row.user_id;
      const username = row.username;
      const content = row.content;
      const creationDate = row.creation_date;
      const likeCount = row.like_count;
      const isAuthor = row.user_id === req.sessionID ? 1 : 0;
      const isLiked = req.session.commentLiked.indexOf(`${id}`) !== -1 ? 1 : 0;

      data.push({ id, userId, username, content, creationDate, likeCount, isAuthor, isLiked });
    });

    res.status(200).json({
      totalPageCount: totalpageCount,
      data: data,
    });
  } catch (err) {
    console.error("댓글 목록 로드 실패", err);
    res.status(500).json({ message: "서버에러: 댓글 목록을 불러오는데 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

// 댓글 작성 함수
async function createComment(req, res) {
  const connection = await getConnection();
  const userId = req.sessionID;
  const username = req.session.name;
  const postID = req.params.postID;
  const content = req.body.content;
  const time = new Date();
  const query = `
    INSERT INTO comment (post_id, user_id, username, content, creation_date)
    VALUES (?, ?, ?, ?, ?)`;

  try {
    await executeQuery(connection, query, [postID, userId, username, content, time]);
    res.status(200).json({ message: "댓글 등록 성공" });
  } catch (err) {
    console.error("댓글 등록 실패", err);
    res.status(500).json({ message: "서버 에러: 댓글 등록에 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

// 댓글 삭제 함수
async function deleteComment(req, res) {
  const authorId = await getAuthorId("comment", req.params.commentID);

  // commentID 해당하는 댓글이 존재하지 않는 경우
  if (!authorId) {
    res.status(404).json({ message: "게시글 없음: 잘못된 댓글 번호입니다." });
    return;
  }

  // 본인이 작성하지 않은 댓글을 수정하려는 경우
  if (req.sessionID !== authorId) {
    res.status(403).json({ message: "권한 없음: 댓글을 수정할 수 없습니다." });
    return;
  }

  const connection = await getConnection();
  const query = `
    DELETE
    FROM comment
    WHERE id = ?`;

  try {
    await executeQuery(connection, query, [req.params.commentID]);
    res.status(200).json({ message: "댓글 삭제 성공" });
  } catch (err) {
    console.error("댓글 삭제 실패", err);
    res.status(500).json({ message: "서버 에러: 댓글 삭제에 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

// 댓글 추천 함수
async function updateLike(req, res) {
  req.session.commentLiked = req.session.commentLiked || [];
  const connection = await getConnection();
  const index = req.session.commentLiked.indexOf(req.params.commentID);

  try {
    // 좋아요를 누른 댓글일 경우
    if (index !== -1) {
      req.session.commentLiked.splice(index, 1);
      const query = `
        UPDATE comment
        SET like_count = IF(like_count > 0, like_count -1, 0)
        WHERE id = ?`;

      await executeQuery(connection, query, [req.params.commentID]);
      res.status(200).json({ message: "댓글 추천을 취소했습니다." });
    }
    // 좋아요를 누르지 않은 댓글일 경우
    else {
      req.session.commentLiked.push(req.params.commentID);
      const query = `
        UPDATE comment
        SET like_count = like_count + 1
        WHERE id = ?`;

      await executeQuery(connection, query, [req.params.commentID]);
      res.status(200).json({ message: "댓글을 추천했습니다." });
    }
  } catch (err) {
    console.error("댓글 추천 실패", err);
    res.status(500).json({ message: "서버 에러: 댓글 추천수 변경에 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

// async function processDatabase(res, query, params, messageType) {
//   const connection = await getConnection();
//   try {
//     await executeQuery(connection, query, params);
//     res.status(200).json({ message: `${messageType} 성공` });
//   } catch (err) {
//     console.error({message: `${messageType} 실패`}, err);
//     res.status(500).json({ message: `서버 에러: ${messageType}에 실패했습니다.` });
//   } finally {
//     endConnection(connection);
//   }
// }

export default { getCommentList, createComment, deleteComment, updateLike };
