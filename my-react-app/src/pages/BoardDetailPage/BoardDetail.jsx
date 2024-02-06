import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import "./BoardDetail.css";
import api from "../../services/api";
import BackHeader from "../../components/Header/BackHeader";
import Comment from "../../components/Comment/Comment";
import strokeLike from "../../assets/images/icon/strokeLike.svg";
import fillLike from "../../assets/images/icon/fillLike.svg";
import chat from "../../assets/images/icon/chat.svg";

function BoardDetail() {
  const { postID } = useParams();
  const [boardData, setBoardData] = useState(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isLiked, setIsLiked] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [boardMenuList, setBoardMenuList] = useState(false);

  const navigate = useNavigate();

  const handleMenuClick = () => {
    setBoardMenuList(!boardMenuList);
  };

  const fetchBoardDetail = () => {
    api.get(`/posts/${postID}`)
    .then((response) => {
      console.log(response.data);
      setBoardData(response.data);
      setIsAuthor(response.data.isAuthor);
      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
      setCommentCount(response.data.commentCount);
    })
    .catch((error) => {
      console.error('API 호출 에러:', error);
    });
  }
  
  useEffect(() => {
    fetchBoardDetail();
  }, [postID]); // boardId가 변경될 때마다 API 호출



  const handleLikeClick = () => {
    api.put(`/posts/${postID}/like`)
      .then((response) => {
        if (response.data.message === '게시글을 추천했습니다.') {
          setIsLiked((prevLike) => prevLike + 1);
          setLikeCount((prevCount) => prevCount + 1);
        } else if (response.data.message === '게시글 추천을 취소했습니다.') {
          setIsLiked((prevLike) => prevLike - 1);
          setLikeCount((prevCount) => prevCount === 0 ? 0 : prevCount - 1);
        }
      })
      .catch((error) => {
        console.error('좋아요 처리 오류:', error);
      });
  };

  const handleEdit = () => {
    if (boardData.isAuthor === 1) {
      navigate(`/boards/edit/${postID}`, { state: { title: boardData.title, content: boardData.content } })
    }
  };

  const handleDelete = () => {
    api.delete(`/posts/${postID}`)
      .then((response) => {
        if (response.data.message === "게시글 삭제 성공") {
          navigate('/boards');
        } else {
          console.error('게시글 삭제 실패');
          alert('삭제가 실패되었네영');
        }
      })
      .catch((error) => {
        console.error('게시글 삭제 오류:', error);
      });
  };


  return (
    <div className='BoardDetail'>
      <BackHeader />
      {boardData ? (
        <div className='boardDetailCont'>
          <div className='nameDateWrap'>
            <p className='userName'>{boardData.username}</p>
            <p className='creationDate'>{boardData.creationDate}</p>
          </div>
          <div className='titleMenuWrap'>
            <p className='title'>{boardData.title}</p>
            {isAuthor === 1 && (
              <div className='boardDetailMenuWrap' onClick={handleMenuClick}>
                <div className='boardDetailMenu'>
                  <p></p>
                  <p></p>
                  <p></p>
                </div>
                {boardMenuList && (
                  <div className='buttonList'>
                    <ul>
                      <li onClick={handleEdit}>수정</li>
                      <li onClick={handleDelete}>삭제</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className='content'>{boardData.content}</p>
          <div className='likeAndCommentWrap'>
            <p className='boardDetailLike' onClick={handleLikeClick}>
              <img src={isLiked === 0 ? strokeLike : fillLike} alt="좋아요버튼" />
              {likeCount}
            </p>
            <p className='replies'>
              <img src={chat} alt="댓글아이콘" />
              {commentCount}
            </p>
          </div>
          <Comment postID={postID} fetchBoardDetail={fetchBoardDetail} />
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );

}

export default BoardDetail;
