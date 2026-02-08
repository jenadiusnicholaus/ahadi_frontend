<script setup lang="ts">
const STEPS = [
  {
    step: 1,
    title: 'Create Your Event',
    description:
      'Set up your event in minutes with our intuitive form. Add details, set your goal, and customize the experience.',
  },
  {
    step: 2,
    title: 'Share & Invite',
    description:
      'Get a unique event code and link. Share via WhatsApp, SMS, or social media to reach your community.',
  },
  {
    step: 3,
    title: 'Collect Contributions',
    description:
      'Receive payments via M-Pesa, Airtel Money, Tigo Pesa, and bank transfers. All in one place.',
  },
  {
    step: 4,
    title: 'Track & Withdraw',
    description:
      'Monitor contributions in real-time. Withdraw funds directly to your mobile money or bank account.',
  },
]
</script>

<template>
  <section id="how-it-works" class="how-it-works">
    <div class="how-it-works-inner">
      <!-- Section label -->
      <div class="section-label">HOW IT WORKS</div>
      <h2 class="section-heading">Get started in minutes</h2>
      <p class="section-subheading">
        Create your event, share with your community, and start receiving contributions seamlessly.
      </p>

      <!-- Desktop: row of step cards with dashed connectors -->
      <div class="steps-row">
        <template v-for="(item, index) in STEPS" :key="item.step">
          <div class="step-card">
            <div class="step-number">{{ item.step }}</div>
            <h3 class="step-title">{{ item.title }}</h3>
            <p class="step-description">{{ item.description }}</p>
          </div>
          <div v-if="index < STEPS.length - 1" class="connector-h" aria-hidden="true" />
        </template>
      </div>

      <!-- Mobile: column of steps with vertical connectors -->
      <div class="steps-column">
        <template v-for="(item, index) in STEPS" :key="'m-' + item.step">
          <div class="step-row">
            <div class="step-number-m">{{ item.step }}</div>
            <div class="step-content">
              <h3 class="step-title-m">{{ item.title }}</h3>
              <p class="step-description-m">{{ item.description }}</p>
            </div>
          </div>
          <div v-if="index < STEPS.length - 1" class="connector-v" aria-hidden="true" />
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-it-works {
  width: 100%;
  max-width: 100%;
  background: #fff;
  padding: 80px 32px 96px;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
}

@media (max-width: 1024px) {
  .how-it-works {
    padding: 64px 24px 80px;
  }
}

@media (max-width: 768px) {
  .how-it-works {
    padding: 48px 16px 56px;
  }
}

@media (max-width: 480px) {
  .how-it-works {
    padding: 40px 12px 48px;
  }
}

.how-it-works-inner {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  text-align: center;
  box-sizing: border-box;
}

.section-label {
  display: inline-block;
  padding: 8px 18px;
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #52525b;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.section-heading {
  font-size: 36px;
  font-weight: 700;
  color: #18181b;
  letter-spacing: -0.03em;
  line-height: 1.2;
  text-align: center;
  margin: 0 0 16px;
}

.section-subheading {
  max-width: 520px;
  margin: 0 auto 56px;
  font-size: 17px;
  color: #71717a;
  line-height: 1.65;
  font-weight: 400;
  text-align: center;
}

@media (max-width: 768px) {
  .section-heading {
    font-size: 26px;
  }
  .section-subheading {
    font-size: 15px;
    margin-bottom: 40px;
  }
}

/* Desktop: horizontal row of cards */
.steps-row {
  display: none;
}

@media (min-width: 769px) {
  .steps-row {
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  .step-card {
    flex: 1;
    min-width: 0;
    padding: 32px 24px 28px;
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e4e4e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
    text-align: center;
    display: flex;
    flex-direction: column;
  }

  .step-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    border-color: #d4d4d8;
  }

  .step-number {
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #18181b;
    border-radius: 50%;
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .step-title {
    font-size: 17px;
    font-weight: 600;
    color: #18181b;
    line-height: 1.35;
    margin: 0 0 10px;
    letter-spacing: -0.01em;
  }

  .step-description {
    font-size: 14px;
    color: #71717a;
    line-height: 1.6;
    margin: 0;
    flex: 1;
  }

  .connector-h {
    width: 20px;
    min-width: 20px;
    height: 56px;
    flex-shrink: 0;
    align-self: center;
    background: transparent
      repeating-linear-gradient(
        to right,
        #d4d4d8 0,
        #d4d4d8 3px,
        transparent 3px,
        transparent 10px
      );
    background-size: 20px 2px;
    background-position: center 27px;
    background-repeat: repeat-x;
  }
}

/* Mobile: vertical column */
.steps-column {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
}

@media (min-width: 769px) {
  .steps-column {
    display: none;
  }
}

.step-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 12px 0;
}

.step-number-m {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #18181b;
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title-m {
  font-size: 17px;
  font-weight: 600;
  color: #18181b;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}

.step-description-m {
  font-size: 14px;
  color: #71717a;
  line-height: 1.6;
  margin: 0;
}

.connector-v {
  width: 2px;
  height: 24px;
  margin-left: 25px;
  background: #e4e4e7;
  flex-shrink: 0;
}
</style>
