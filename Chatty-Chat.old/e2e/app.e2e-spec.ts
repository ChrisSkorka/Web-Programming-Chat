import { ChattyChatPage } from './app.po';

describe('chatty-chat App', function() {
  let page: ChattyChatPage;

  beforeEach(() => {
    page = new ChattyChatPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
