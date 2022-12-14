import { addCommas, convertToNumber } from '/useful-functions.js';
import * as Api from '/api.js';
import { header, addHeaderEventListener } from '/header/header.js';
import { createCategory, addCategoryListener} from '/category/category.js';

/****************************요소 모음**********************************/
const nav = document.getElementById('header');
const navCategory = document.getElementById('category');
const itemsBody = document.querySelector('.items-body');
const headerItemNumber = document.querySelector('.header-item-number');
const checkAll = document.querySelector('.check-all');
const totalPriceSum = document.querySelector('.total-price-sum');
const deleteAllButton = document.querySelector('.delete-all-button');
const deleteCheckedButton = document.querySelector('.delete-checked-button');
const orderButton = document.querySelector('.order-button');

// 상품 아이디 배열, 체크 인덱스 배열
const productIdArray = [];
const isCheckedArray = [];
/*********************************************************************/


(async() => {
  /***************************헤더*************************************/
  nav.insertAdjacentElement('afterbegin', header);
  const categories = await Api.get('/category/list');
  navCategory.insertAdjacentHTML('afterbegin', await createCategory({ categories }));
  addHeaderEventListener();
  addCategoryListener(navCategory);
  /*******************************************************************/

  const hashedEmail = localStorage.getItem('hashedEmail');
  const onRequest = indexedDB.open(hashedEmail, 1);
  onRequest.onsuccess = () => { 
      const db = onRequest.result;
      const transaction = db.transaction('cart', 'readonly');
      const results = transaction.objectStore('cart').getAll();

      // indexedDB에서 데이터 가져오기 성공
      results.onsuccess = () => {
        const cartProducts = results.result;


        /**********************장바구니 비었을때 렌더링***************************/
        // 장바구니가 비었을 경우
        if(cartProducts.length === 0) {
          itemsBody.insertAdjacentHTML('beforeend', makeNoItemContainerHTML());
          setNoItemHeaderContent();
        } 
        /***********************************************************************/


        /********************장바구니에 요소가 있을때 렌더링*************************/
        else {
          // body에 요소 추가
          cartProducts.forEach((product, index) => {
            itemsBody.insertAdjacentHTML('beforeend', makeItemContainerHTML(product, index));
            productIdArray.push(`${product.productId}${product.size}${product.color}`);
            isCheckedArray.push(false);
          })
          setItemHeaderContent(cartProducts);

          // 이미지 박스 이벤트 추가
          const imageBoxes = itemsBody.getElementsByClassName('image-box');
          Array.from(imageBoxes)
               .forEach((imgBox, index) => {
                  imgBox.style.backgroundImage = `url( "${cartProducts[index].imagePath}" )`;
                  imgBox.addEventListener('click', (e) => {
                    window.location.href = `/product/?id=${cartProducts[index].productId}`;
                })
               });
          

          // 전체삭제 이벤트 추가
          deleteAllButton.addEventListener('click', (e) => {
            e.preventDefault();
            const isDelete = confirm('전체 상품을 삭제하시겠습니까?');
            if (isDelete) {
              const transaction = db.transaction('cart', 'readwrite');
              transaction.objectStore('cart').clear();
              window.location.reload()
            }
          })


          // 선택 삭제 이벤트 추가
          deleteCheckedButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            const deleteItemsList = productIdArray
                                      .filter((elem, index) => isCheckedArray[index])
            
            const isDelete = confirm('선택한 상품을 삭제하시겠습니까?');
            if (isDelete) {
              const transaction = db.transaction('cart', 'readwrite');
              deleteItemsList.forEach(item => {
                transaction.objectStore('cart').delete(item);
              })
              window.location.reload()
            }
          })


          // 삭제하기 버튼 이벤트 추가
          const deleteButtons = itemsBody.getElementsByClassName('delete-button');
          Array.from(deleteButtons)
               .forEach((deleteButton) => {
                 deleteButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isDelete = confirm('상품을 삭제하시겠습니까?');
                    if (isDelete) {
                      const index = Number(e.target.dataset.itemIndex);
                      const transaction = db.transaction('cart', 'readwrite');
                      transaction.objectStore('cart').delete(productIdArray[index]);
                      window.location.reload()
                   }
                 })
               })
          
          
          // 체크박스 버튼 이벤트 추가
          const checkOneBoxes = itemsBody.getElementsByClassName('check-one');
          Array.from(checkOneBoxes)
               .forEach((checkOneBox) => {
                  checkOneBox.addEventListener('mouseup', (e) => {
                  const boxIndex = Number(e.target.dataset.itemIndex);
                  

                  // 체크한 상태면 false로
                  if(isCheckedArray[boxIndex]) {
                    isCheckedArray[boxIndex] = false;
                  }

                  // 체크 안한 상태면 true로
                  else {
                    isCheckedArray[boxIndex] = true;
                  }

                  // 전체 박스가 선택되었는지 값 저장
                  const isAllChecked = isCheckedArray.every(bool => bool);

                  // 전체 선택됐으면 전체 박스 자동 선택
                  if (isAllChecked) {
                    checkAll.checked = true;
                  }

                  // 하나라도 선택 가능하면 전체 박스 빈칸
                  else {
                    checkAll.checked = false;
                  }

                  getTotalPriceSum();
                 })
               })
        }
        /************************************************************************/



        /***********************전체 박스 이벤트 추가******************************/
        checkAll.addEventListener('mouseup', (e) => {
          const checkOneBoxes = itemsBody.getElementsByClassName('check-one');

          // 체크 풀림 -> 전체 박스 풀림
          if(!e.target.checked) {
            Array.from(checkOneBoxes)
                .forEach((checkOneBox, index) => {
                  checkOneBox.checked = true;
                  isCheckedArray[index] = true;
                  getTotalPriceSum();
                })
          }

          // 체크 선택 -> 전체 박스 선택
          else {
            Array.from(checkOneBoxes)
                .forEach((checkOneBox, index) => {
                  checkOneBox.checked = false;
                  isCheckedArray[index] = false;
                  getTotalPriceSum();
                })
          }
        })
        /************************************************************************/



        /*************************수량 관련 이벤트 추가****************************/
        const upButtons = itemsBody.getElementsByClassName('up-button');
        const downButtons = itemsBody.getElementsByClassName('down-button');
        const quantities = itemsBody.getElementsByClassName('quantity');

        // 수량 증가 버튼
        Array.from(upButtons)
             .forEach((upButton, index) => {
                upButton.addEventListener('click', (e) => {
                  e.preventDefault();
                  const quantityNum = cartProducts[index].quantity;
                  if (quantityNum === 99){
                    alert('1 이상 99 이하의 수량만 가능합니다.')
                  } else {
                    // db에 반영 후 새로고침
                    const transaction = db.transaction('cart', 'readwrite');
                    transaction.objectStore('cart').put({
                      ...cartProducts[index],
                      quantity: quantityNum + 1 
                    });
                    alert('수량이 변경되었습니다.');
                    window.location.reload();
                  }

                })
              })
        
        
        // 수량 감소 버튼
        Array.from(downButtons)
             .forEach((downButton, index) => {
                downButton.addEventListener('click', (e) => {
                  e.preventDefault();
                  const quantityNum = cartProducts[index].quantity;
                  if (quantityNum === 1){
                    alert('1 이상 99 이하의 수량만 가능합니다.')
                  } else {
                    // db에 반영 후 새로고침
                    const transaction = db.transaction('cart', 'readwrite');
                    transaction.objectStore('cart').put({
                      ...cartProducts[index],
                      quantity: quantityNum - 1 
                    });
                    alert('수량이 변경되었습니다.');
                    window.location.reload();
                  }

                })
              })

        
        // 수량 직접 입력
        Array.from(quantities)
             .forEach((quantity, index) => {
                quantity.addEventListener('change', (e) => {
                  const quantityNum = parseInt(e.target.value);
                  
                  // 1이상 99이하면 그대로 반영
                  if(quantityNum >= 1 && quantityNum <= 99) {
                    // db에 반영 후 새로고침
                    const transaction = db.transaction('cart', 'readwrite');
                    transaction.objectStore('cart').put({
                      ...cartProducts[index],
                      quantity: quantityNum 
                    });
                    alert('수량이 변경되었습니다.');
                    window.location.reload();
                  }

                  // 그 외에는 원래 수량으로 채운다
                  else {
                    alert('1 이상 99 이하의 수량만 가능합니다.');
                    e.target.value = cartProducts[index].quantity;
                  }
                })
              })
        /************************************************************************/



        /*************************주문하기 버튼 이벤트 추가****************************/
        orderButton.addEventListener('click', (e) => {
          e.preventDefault();
          const totalSum = convertToNumber(totalPriceSum.textContent);
          if (totalSum === 0) {
            alert('주문할 상품을 선택해주세요.');
          } else {
            const transaction = db.transaction('cart', 'readwrite');
            cartProducts.forEach((productInfo, index) => {
                            transaction.objectStore('cart').put({
                              ...productInfo,
                              isChecked: isCheckedArray[index]
                            })
                          })
            window.location.href = '/order?storeName=cart';   
          }      
        })
        /************************************************************************/
      }
  }  
})()

function makeNoItemContainerHTML() {
  return '<div class="no-item-container">장바구니에 담긴 상품이 없습니다.</div>';
}

function setNoItemHeaderContent() {
  headerItemNumber.textContent = '전체 0개';
  checkAll.disabled = true;
  totalPriceSum.textContent = '0원'
}

function makeItemContainerHTML(product, index) {
  return `
  <div class="item-container">
    <div class="item-number">${index + 1}</div>
    <div class="checkbox-container">
      <input type="checkbox" class="check-one" data-item-index="${index}">
    </div>
    <div class="product-name-options">
      <div class="image-box"></div>
      <div class="options-box">
        <div class="product-name">${product.productName}</div>
        <div class="options">옵션: ${product.size} / ${product.color}</div>
      </div>
    </div>
    <div class="price">${addCommas(product.price)}</div>

    <div class="product-quantity-container">
        <span class="fa-solid fa-plus quantity-wrap up-button"></span>
        <input class="quantity" value="${product.quantity}" type="text">
        <span class="fa-solid fa-minus quantity-wrap down-button"></span>
    </div>
    
    <div class="total-price">${addCommas(product.price * product.quantity)}</div>
    <div class="delete-button-container">
      <input class="delete-button" type="button" value="삭제하기" data-item-index="${index}">
      <input class="delete-button delete-button-responsive" type="button" value="X" data-item-index="${index}">
    </div>
  </div>
  `
}

function setItemHeaderContent(cartProducts) {
  headerItemNumber.textContent = `전체 ${cartProducts.length}개`;
  totalPriceSum.textContent = '0원';
}

function getTotalPriceSum() {
  const totalPrices = document.getElementsByClassName('total-price');
  let sum = 0;
  Array.from(totalPrices).forEach((elem, index) => {
    if(isCheckedArray[index]) {
      sum += convertToNumber(elem.textContent);
    }
  })
  totalPriceSum.textContent = `${addCommas(sum)}원`;
}