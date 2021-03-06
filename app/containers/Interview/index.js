/**
 *
 * Interview
 *
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';
import {
  makeSelectSelectedCategories,
  makeSelectSelectedCategoryList,
  makeSelectRemainingQuestions,
} from 'containers/WorkSpace/selectors';

import {
  questionAnswered,
  removeCategory,
  updateRemainingQuestions,
} from 'containers/WorkSpace/actions';

import injectReducer from 'utils/injectReducer';
import makeSelectInterview from './selectors';
import reducer from './reducer';
import style from './style.scss';

import {
  getQuestion,
  checkAnswer,
  updateMyAnswer,
  showMyAnswer,
  hideMyAnswer,
  startLoading,
  loadingFinished,
  finishQuestion,
  reset,
  finishInterview,
} from './actions';

export class Interview extends React.Component {
  constructor(props) {
    super(props);

    this.questionAnswered = this.questionAnswered.bind(this);
    this.goNext = this.goNext.bind(this);
    this.toggleSpoiler = this.toggleSpoiler.bind(this);
  }

  async componentDidMount() {
    if (!this.props.selectedCategoryList.length) {
      this.props.history.push('/');
    } else {
      await this.props.startLoading();

      await this.getQuestion();

      await this.props.loadingFinished();
    }
  }

  checkRemainingQuestions() {
    const {
      selectedCategoryList,
      selectedCategories,
      remainingQuestions,
    } = this.props;

    // Clean answered categories
    selectedCategoryList.forEach(categoryName => {
      if (!selectedCategories[categoryName].length) {
        this.props.removeCategory(categoryName);
      }
    });

    if (remainingQuestions === 0) {
      this.props.finishInterview();
    }
  }

  getQuestion() {
    const { selectedCategories, selectedCategoryList } = this.props;

    const categoryName =
      selectedCategoryList[
        Math.floor(Math.random() * selectedCategoryList.length)
      ];

    const selectedCategory = selectedCategories[categoryName];

    const blockIndex = Math.floor(Math.random() * selectedCategory.length);

    const block = selectedCategory[blockIndex];

    this.props.getQuestion(categoryName, blockIndex, block);
  }

  async questionAnswered() {
    const {
      myAnswer,
      block,
      blockIndex,
      currentCategory,
    } = this.props.interview;
    const question = {
      myAnswer,
      ...block,
    };

    await this.props.questionAnswered(question, blockIndex, currentCategory);

    await this.props.updateRemainingQuestions(
      this.props.remainingQuestions - 1,
    );

    await this.props.finishQuestion();

    await this.checkRemainingQuestions();
  }

  goNext() {
    if (this.props.interview.allQuestionsAnswered) {
      this.props.history.push('/results');
    } else {
      this.props.reset();
      this.getQuestion();
    }
  }

  toggleSpoiler() {
    if (this.props.interview.myAnswerShown) {
      this.props.hideMyAnswer();
    } else {
      this.props.showMyAnswer();
    }
  }

  render() {
    const { question, answer } = this.props.interview.block;
    const {
      loaded,
      loading,
      currentCategory,
      myAnswer,
      myAnswerShown,
      answerShown,
      readyToGo,
      allQuestionsAnswered,
    } = this.props.interview;
    if (loaded) {
      return (
        <div className={style.interview}>
          <Helmet>
            <title>Interview</title>
            <meta name="description" content="Description of Interview" />
          </Helmet>
          <div className={style.title}>{currentCategory}</div>
          <p className={style.question}>{question}</p>

          {!answerShown && (
            <textarea
              className={style.myAnswerField}
              value={myAnswer}
              onChange={e => this.props.updateMyAnswer(e.target.value)}
            />
          )}

          {/* eslint-disable react/no-array-index-key */}
          {answerShown &&
            answer.map((item, index) => (
              <p
                className={style.answerChunk}
                key={`${item.substr(0, 5)}${index}`}
              >
                {item}
              </p>
            ))}
          {/* eslint-enable */}

          <div className={style.controls}>
            {!answerShown && (
              <button
                className={style.control}
                onClick={this.props.checkAnswer}
              >
                Check the answer
              </button>
            )}

            {answerShown && (!readyToGo && answerShown) ? (
              <Fragment>
                <button
                  className={style.control}
                  onClick={this.questionAnswered}
                >
                  I knew that{' '}
                  <span role="img" aria-label="Sunglasses">
                    😎
                  </span>
                </button>
                <button className={style.control} onClick={this.goNext}>
                  I need to study more{' '}
                  <span role="img" aria-label="Sunglasses">
                    ☕️
                  </span>
                </button>
              </Fragment>
            ) : (
              <Fragment>
                <button className={style.control} onClick={this.goNext}>
                  {allQuestionsAnswered
                    ? 'Go to the results'
                    : 'Go to the next question'}
                </button>
              </Fragment>
            )}
          </div>

          {answerShown && myAnswer.length ? (
            <button
              onClick={this.toggleSpoiler}
              className={[
                myAnswerShown ? style.spoiler__opened : style.spoiler,
              ].join(' ')}
            >
              <span
                className={[
                  myAnswerShown
                    ? style.spoiler_arrow__down
                    : style.spoiler_arrow,
                ].join(' ')}
              >
                {'>'}
              </span>{' '}
              {myAnswerShown ? 'Hide' : 'Show'} my answer
            </button>
          ) : null}

          {myAnswerShown && <p className={style.myAnswer}>{myAnswer}</p>}
        </div>
      );
    } else if (loading) {
      return <div>Loading...</div>;
    }
    return <div>Not loaded</div>;
  }
}

Interview.propTypes = {
  interview: PropTypes.shape({
    block: PropTypes.shape({
      question: PropTypes.string,
      answer: PropTypes.array,
    }),
    blockIndex: PropTypes.number,
    myAnswer: PropTypes.string,
    myAnswerShown: PropTypes.bool,
    answerShown: PropTypes.bool,
    currentCategory: PropTypes.string,
    loaded: PropTypes.bool,
    loading: PropTypes.bool,
    readyToGo: PropTypes.bool,
    allQuestionsAnswered: PropTypes.bool,
  }),
  getQuestion: PropTypes.func,
  checkAnswer: PropTypes.func,
  updateMyAnswer: PropTypes.func,
  showMyAnswer: PropTypes.func,
  hideMyAnswer: PropTypes.func,
  questionAnswered: PropTypes.func,
  removeCategory: PropTypes.func,
  startLoading: PropTypes.func,
  loadingFinished: PropTypes.func,
  finishQuestion: PropTypes.func,
  reset: PropTypes.func,
  finishInterview: PropTypes.func,
  selectedCategories: PropTypes.object,
  selectedCategoryList: PropTypes.array,
  remainingQuestions: PropTypes.number,
  updateRemainingQuestions: PropTypes.func,
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
};

const mapStateToProps = createStructuredSelector({
  interview: makeSelectInterview(),
  selectedCategories: makeSelectSelectedCategories(),
  selectedCategoryList: makeSelectSelectedCategoryList(),
  remainingQuestions: makeSelectRemainingQuestions(),
});

function mapDispatchToProps(dispatch) {
  return {
    getQuestion: (currentCategory, blockIndex, block) =>
      dispatch(getQuestion(currentCategory, blockIndex, block)),
    checkAnswer: () => dispatch(checkAnswer()),
    updateMyAnswer: text => dispatch(updateMyAnswer(text)),
    showMyAnswer: () => dispatch(showMyAnswer()),
    hideMyAnswer: () => dispatch(hideMyAnswer()),
    startLoading: () => dispatch(startLoading()),
    loadingFinished: () => dispatch(loadingFinished()),
    questionAnswered: (question, questionIndex, categoryName) =>
      dispatch(questionAnswered(question, questionIndex, categoryName)),
    removeCategory: categoryName => dispatch(removeCategory(categoryName)),
    finishQuestion: () => dispatch(finishQuestion()),
    reset: () => dispatch(reset()),
    finishInterview: () => dispatch(finishInterview()),
    updateRemainingQuestions: value =>
      dispatch(updateRemainingQuestions(value)),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

const withReducer = injectReducer({ key: 'interview', reducer });

export default compose(
  withReducer,
  withConnect,
)(Interview);
