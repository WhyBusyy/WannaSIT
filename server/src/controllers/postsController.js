import { getConnection, executeQuery, endConnection } from "../services/databaseService.js";
import getAuthorId from "../utils/getAuthorId.js";

// 게시글 목록 함수
async function getPostList(req, res) {
  const connection = await getConnection();
  const pageNum = req.query.pageNum;

  // 잘못된 pageNum 에러처리
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ message: "잘못된 페이지 번호입니다." });
  }

  const searchParams = req.query.title ? `%${req.query.title}%` : "%";
  const totalPostQuery = `
    SELECT COUNT(*) AS cnt
    FROM post
    WHERE title LIKE ?`;
  const query = `
    SELECT id, username, title, SUBSTRING(content, 1, 20) AS content, DATE_FORMAT(creation_date, '%Y-%m-%d %H:%i:%s') AS creation_date, like_count
    FROM post
    WHERE title LIKE ?
    ORDER BY creation_date DESC
    LIMIT 5 OFFSET ?`;

  try {
    const [totalPostCount] = await executeQuery(connection, totalPostQuery, [searchParams]);
    const totalpageCount = Math.ceil(totalPostCount[0].cnt / 5) || 1;

    if (pageNum > totalpageCount) throw new Error("잘못된 페이지 번호입니다.");

    const [rows] = await executeQuery(connection, query, [searchParams, (pageNum - 1) * 5]);
    res.status(200).json({
      totalPageCount: totalpageCount,
      data: rows,
    });
  } catch (err) {
    console.error("게시글 목록 로드 실패", err);
    res.status(500).json({ message: "서버에러: 게시글 목록을 불러오는데 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

// 게시글 상세정보 함수
async function getPostDetail(req, res) {
  req.session.postLiked = req.session.postLiked || [];
  const connection = await getConnection();
  const postQuery = `
    SELECT p.user_id, p.username, p.title, p.content, DATE_FORMAT(p.creation_date, '%Y-%m-%d %H:%i:%s') AS creation_date, p.like_count, COUNT(c.id) AS comment_count
    FROM post p LEFT JOIN comment c ON p.id = c.post_id
    WHERE p.id = ?
    GROUP BY p.user_id, p.username, p.title, p.content, creation_date, p.like_count;`;

  try {
    const [rows] = await executeQuery(connection, postQuery, [req.params.postID]);
    const row = rows[0];
    res.status(200).json({
      userId: row.user_id,
      username: row.username,
      title: row.title,
      content: row.content,
      creationDate: row.creation_date,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      isAuthor: row.user_id === req.sessionID ? 1 : 0,
      isLiked: req.session.postLiked.indexOf(req.params.postID) !== -1 ? 1 : 0,
    });
  } catch (err) {
    console.error("게시글 상세정보 로드 실패", err);
    res.status(404).json({ message: "게시글 없음: 잘못된 게시글 번호입니다." });
  } finally {
    endConnection(connection);
  }
}

// 게시글 작성 함수
async function createPost(req, res) {
  const connection = await getConnection();
  const userId = req.sessionID;
  const username = req.session.name;
  const title = req.body.title;
  const content = req.body.content;
  const time = new Date();
  const query = `
    INSERT INTO post (user_id, username, title, content, creation_date)
    VALUES (?, ?, ?, ?, ?)`;

  try {
    await executeQuery(connection, query, [userId, username, title, content, time]);
    res.status(200).json({ message: "게시글 등록 성공" });
  } catch (err) {
    console.error("게시글 등록 실패", err);
    res.status(500).json({ message: "서버 에러: 게시글 등록에 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

// 게시글 수정 함수
async function updatePost(req, res) {
  const authorId = await getAuthorId("post", req.params.postID);

  // postID 해당하는 게시글이 존재하지 않는 경우
  if (!authorId) {
    res.status(404).json({ message: "게시글 없음: 잘못된 게시글 번호입니다." });
    return;
  }

  // 본인이 작성하지 않은 게시글을 수정하려는 경우
  if (req.sessionID !== authorId) {
    res.status(403).json({ message: "권한 없음: 게시글을 수정할 수 없습니다." });
    return;
  }

  const connection = await getConnection();
  const title = req.body.title;
  const content = req.body.content;
  const time = new Date();
  const query = `
    UPDATE post
    SET title = ?, content = ?, creation_date = ?
    WHERE id = ?`;

  try {
    await executeQuery(connection, query, [title, content, time, req.params.postID]);
    res.status(200).json({ message: "게시글 수정 성공" });
  } catch (err) {
    console.error("게시글 수정 실패", err);
    res.status(500).json({ message: "서버 에러: 게시글 수정에 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

// 게시글 삭제 함수
async function deletePost(req, res) {
  const authorId = await getAuthorId("post", req.params.postID);

  // postID 해당하는 게시글이 존재하지 않는 경우
  if (!authorId) {
    res.status(404).json({ message: "게시글 없음: 잘못된 게시글 번호입니다." });
    return;
  }

  // 본인이 작성하지 않은 게시글을 삭제하려는 경우
  if (req.sessionID !== authorId) {
    res.status(403).json({ message: "권한 없음: 게시글을 삭제할 수 없습니다." });
    return;
  }

  const connection = await getConnection();
  const query = `
    DELETE
    FROM post
    WHERE id = ?`;

  try {
    await executeQuery(connection, query, [req.params.postID]);
    res.status(200).json({ message: "게시글 삭제 성공" });
  } catch (err) {
    console.error("게시글 삭제 실패", err);
    res.status(500).json({ message: "서버 에러: 게시글 삭제에 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

// 게시글 추천 함수
async function updateLike(req, res) {
  req.session.postLiked = req.session.postLiked || [];
  const connection = await getConnection();
  const index = req.session.postLiked.indexOf(req.params.postID);

  try {
    // 좋아요를 누른 게시글일 경우
    if (index !== -1) {
      req.session.postLiked.splice(index, 1);
      const query = `
        UPDATE post
        SET like_count = IF(like_count > 0, like_count -1, 0)
        WHERE id = ?`;

      await executeQuery(connection, query, [req.params.postID]);
      res.status(200).json({ message: "게시글 추천을 취소했습니다." });
    }
    // 좋아요를 누르지 않은 게시글일 경우
    else {
      req.session.postLiked.push(req.params.postID);
      const query = `
        UPDATE post
        SET like_count = like_count + 1
        WHERE id = ?`;

      await executeQuery(connection, query, [req.params.postID]);
      res.status(200).json({ message: "게시글을 추천했습니다." });
    }
  } catch (err) {
    console.error("게시글 추천 실패", err);
    res.status(500).json({ message: "서버 에러: 게시글 추천수 변경에 실패했습니다." });
  } finally {
    endConnection(connection);
  }
}

export default { getPostList, getPostDetail, createPost, updatePost, deletePost, updateLike };
