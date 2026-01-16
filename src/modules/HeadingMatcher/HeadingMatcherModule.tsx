import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './HeadingMatcher.css';

interface HeadingMatcherModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function HeadingMatcherModule({ activeTab }: HeadingMatcherModuleProps) {
    return (
        <div className="heading-matcher-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
