import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './VocabExpander.css';

interface VocabExpanderModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function VocabExpanderModule({ activeTab }: VocabExpanderModuleProps) {
    return (
        <div className="vocab-expander-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
