import React, { useState, useEffect } from "react";
import api from "../../services/api";
import "./Comment.css";
import strokeLike from "../../assets/images/icon/strokeLike.svg";
import fillLike from "../../assets/images/icon/fillLike.svg";

function Comment({ postID, fetchBoardDetail }) {
  const [comments, setComments] = useState([]);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [commentContWrap, setCommentContWrap] = useState(null);

  const handleKeyUp = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.target.blur();
      handleCommentRegistration();
    }
  };

  const fetchComments = (pageNum) => {
    setIsLoading(true);
    api.get(`posts/${postID}/comments?pageNum=${pageNum}`)
      .then(({ data }) => {
        const { data: responseData, totalPageCount } = data;
        if (pageNum === 1) {
          setComments(responseData);
          setTotalPages(totalPageCount);
        } else {
          setComments((prevComments) => [...prevComments, ...responseData]);
        }
      })
      .catch((error) => {
        console.error('에러:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });

  };

  const handleCommentRegistration = async () => {
    try {
      const trimContent = content.trim();
      if (trimContent === "") {
        return;
      }

      const formData = { content };
      const response = await api.post(`posts/${postID}/comments`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.message === "댓글 등록 성공") {
        setContent('');
        setPageNum(1);
        fetchComments(pageNum);
        fetchBoardDetail();

        if (commentContWrap) {
          commentContWrap.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }
      }
    } catch (error) {
      console.error('댓글 쓰기 오류:', error.message);
    }

  };

  const handleLikeClick = (commentID) => {
    const copyComments = [...comments]
    const currentCommentIndex = copyComments.findIndex((comment) => comment.id === commentID);
    const currentIsLiked = copyComments[currentCommentIndex].isLiked;
    console.log('현재 추천 상태:', currentIsLiked);

    api.put(`/posts/${postID}/comments/${commentID}/like`)
      .then((response) => {
        if (response.data.message === '댓글을 추천했습니다.') {
          // 기존 댓글 배열을 변경하지 않고 특정 댓글만 업데이트
          copyComments[currentCommentIndex] = {
            ...copyComments[currentCommentIndex],
            isLiked: currentIsLiked + 1,
            likeCount: copyComments[currentCommentIndex].likeCount + 1,
          };

          // 업데이트된 배열을 상태로 설정
          setComments([...copyComments]);
          console.log('요청 후 추천 상태', [...copyComments]);
        } else if (response.data.message === '댓글 추천을 취소했습니다.') {
          // 기존 댓글 배열을 변경하지 않고 특정 댓글만 업데이트
          copyComments[currentCommentIndex] = {
            ...copyComments[currentCommentIndex],
            isLiked: currentIsLiked - 1,
            likeCount: copyComments[currentCommentIndex].likeCount - 1,
          };
          // 업데이트된 배열을 상태로 설정
          setComments([...copyComments]);
          console.log('요청 후 추천취소', [...copyComments]);
        }
      })
      .catch((error) => {
        console.error('좋아요 처리 오류:', error);
      });
  };

  useEffect(() => {
    fetchComments(pageNum);
  }, [pageNum]);

  const handleDelete = (commentID) => {
    api.delete(`/posts/${postID}/comments/${commentID}`)
      .then((response) => {
        if (response.data.message === "댓글 삭제 성공") {
          fetchComments(1);
          fetchBoardDetail();

        } else {
          console.error('댓글 삭제 실패');
          alert('삭제가 실패되었네영');
        }
      })
      .catch((error) => {
        console.error('게시글 삭제 오류:', error);
      });
  };

  useEffect(() => {
    const commentContWrapElement = document.querySelector('.commentContWrap');
    setCommentContWrap(commentContWrapElement);


    const handleScroll = () => {
      const scrollTop = commentContWrapElement.scrollTop;
      const scrollHeight = commentContWrapElement.scrollHeight;
      const clientHeight = commentContWrapElement.clientHeight;
      const targetScrollPosition = scrollHeight - 10;

      if (scrollTop + clientHeight >= targetScrollPosition) {
        if (!isLoading && pageNum < totalPages) {
          setPageNum(pageNum + 1);
        }
      }
    };

    commentContWrapElement.addEventListener('scroll', handleScroll);

    return () => {
      commentContWrapElement.removeEventListener('scroll', handleScroll);
    };
  }, [isLoading, pageNum, totalPages]);


  return (
    <div className='Comment'>
      <div className="commentContWrap">
        <div className="commentCont">
          {comments.length > 0 ? (
            comments.map(comment => (
              <div className="commentList" key={comment.id}>
                <ul>
                  <div className="titleAndDelWrap">
                    <li>{comment.username}</li>
                    {comment.isAuthor === 1 && (
                      <li className="commentDelButton" onClick={() => handleDelete(comment.id)}>
                        | 삭제
                      </li>
                    )}
                  </div>
                  <li>{comment.content}</li>
                  <li>{comment.creationDate}</li>
                  <li onClick={() => handleLikeClick(comment.id)}>
                    <img src={comment.isLiked === 0 ? strokeLike : fillLike} alt="좋아요버튼" />
                    {comment.likeCount}
                  </li>
                </ul>

              </div>
            ))
          ) : (
            <p>댓글 목록이 없습니다.</p>
          )}
        </div>
      </div>
      <div className="commentInput">
        <input
          type="text"
          id="inputMessage"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyUp={handleKeyUp}
          placeholder="댓글을 입력하세요"
        />
        <p className="commentRegistrationButton" onClick={handleCommentRegistration}>등록</p>
      </div>
    </div>
  );
}

export default Comment;